import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { requireLeadOwnership } from "@/lib/auth/lead-ownership"
import { extractDocumentExpirationDate, isDocumentExpired } from "@/lib/ai/document-expiration"


export const maxDuration = 30

// POST - Upload file to storage and create document record
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const leadId = formData.get("lead_id") as string
    const documentType = formData.get("document_type") as string
    const graduateType = formData.get("graduate_type") as string
    const expirationDate = formData.get("expiration_date") as string | null

    if (!file || !leadId || !documentType || !graduateType) {
      return NextResponse.json({
        error: "Missing required fields: file, lead_id, document_type, graduate_type"
      }, { status: 400 })
    }

    // Defense-in-depth: storage upload uses service role (bypasses RLS),
    // so we must verify the caller owns the lead before letting them write
    // into that lead's storage namespace.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single()
    const ownershipBlock = await requireLeadOwnership(supabase, { userId: user.id, role: profile?.role as 'admin' | 'agent' | undefined }, leadId)
    if (ownershipBlock) return ownershipBlock

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File is too large. Maximum size is 10MB." }, { status: 400 })
    }

    // Validate file type (allowlist)
    const ALLOWED_TYPES = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx']

    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { error: `File type not allowed. Accepted types: PDF, JPG, PNG, WEBP, DOC, DOCX` },
        { status: 400 }
      )
    }

    // Use service role client for storage operations (bypasses storage RLS)
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const storagePath = `leads/${leadId}/psp/${graduateType}/${documentType}/${timestamp}-${safeName}`

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const extraction = await extractDocumentExpirationDate({
      buffer,
      mimeType: file.type,
      fileName: file.name,
      documentType,
      graduateType,
    })
    if (extraction.error) {
      console.warn("Document expiration AI extraction skipped/failed:", extraction.error)
    }
    const finalExpirationDate = expirationDate || extraction.expirationDate

    // Upload to storage
    const { error: uploadError } = await serviceClient.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)

      // If bucket doesn't exist, try to create it
      if (uploadError.message.includes("Bucket not found") || uploadError.message.includes("not found")) {
        const { error: bucketError } = await serviceClient.storage.createBucket("documents", {
          public: false,
          fileSizeLimit: 10 * 1024 * 1024,
        })

        if (bucketError && !bucketError.message.includes("already exists")) {
          console.error("Failed to create bucket:", bucketError)
          return NextResponse.json({ error: "Document storage is not configured. Please contact support." }, { status: 500 })
        }

        // Retry upload after creating bucket
        const { error: retryError } = await serviceClient.storage
          .from("documents")
          .upload(storagePath, buffer, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
          })

        if (retryError) {
          console.error("Retry upload error:", retryError)
          return NextResponse.json({ error: "Failed to upload file to storage." }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: "Failed to upload file to storage." }, { status: 500 })
      }
    }

    // Get signed URL (1 hour expiry)
    const { data: urlData, error: signedUrlError } = await serviceClient.storage
      .from("documents")
      .createSignedUrl(storagePath, 3600)

    if (signedUrlError) {
      console.error("Failed to create signed URL:", signedUrlError)
      return NextResponse.json({ error: "Failed to generate document URL" }, { status: 500 })
    }

    // Save to database using the user's supabase client (respects RLS)
    const { data, error } = await supabase
      .from("psp_documents")
      .upsert({
        lead_id: leadId,
        document_type: documentType,
        graduate_type: graduateType,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        public_url: urlData?.signedUrl,
        expiration_date: finalExpirationDate || null,
        is_expired: isDocumentExpired(finalExpirationDate),
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString(),
        is_verified: false,
        verified_by: null,
        verified_at: null,
        verification_notes: null,
      }, {
        onConflict: "lead_id,document_type,graduate_type",
        ignoreDuplicates: false,
      })
      .select(`
        *,
        verified_by_profile:profiles!verified_by(id, full_name, email),
        uploaded_by_profile:profiles!uploaded_by(id, full_name, email)
      `)
      .single()

    if (error) {
      console.error("Error creating PSP document record:", error)
      // Try without profile joins
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("psp_documents")
        .upsert({
          lead_id: leadId,
          document_type: documentType,
          graduate_type: graduateType,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: storagePath,
          public_url: urlData?.signedUrl,
          expiration_date: finalExpirationDate || null,
          is_expired: isDocumentExpired(finalExpirationDate),
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
          is_verified: false,
          verified_by: null,
          verified_at: null,
          verification_notes: null,
        }, {
          onConflict: "lead_id,document_type,graduate_type",
          ignoreDuplicates: false,
        })
        .select("*")
        .single()

      if (fallbackError) {
        console.error("Fallback insert also failed:", fallbackError)
        return NextResponse.json({ error: "Failed to save document record" }, { status: 500 })
      }

      return NextResponse.json({
        document: fallbackData,
        public_url: urlData?.signedUrl,
        storage_path: storagePath,
        expiration_extraction: extraction,
      })
    }

    return NextResponse.json({
      document: data,
      public_url: urlData?.signedUrl,
      storage_path: storagePath,
      expiration_extraction: extraction,
    })
  } catch (err) {
    console.error("Error uploading PSP document:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
