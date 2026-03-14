import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"]
const BUCKET = "avatars"

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Max 2MB." }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPG, PNG, or GIF." }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()

    // Ensure bucket exists
    const { data: buckets, error: listError } = await serviceClient.storage.listBuckets()
    if (listError) {
      console.error("Failed to list buckets:", listError)
      return NextResponse.json({ error: "Storage not available" }, { status: 500 })
    }
    const bucketExists = buckets?.some(b => b.name === BUCKET)
    if (!bucketExists) {
      const { error: createBucketError } = await serviceClient.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE,
      })
      if (createBucketError) {
        console.error("Failed to create avatars bucket:", createBucketError)
        return NextResponse.json({ error: "Storage not available" }, { status: 500 })
      }
    }

    // Delete old avatar if exists (non-blocking — don't fail upload if cleanup fails)
    try {
      const { data: oldFiles } = await serviceClient.storage
        .from(BUCKET)
        .list(user.id)

      if (oldFiles && oldFiles.length > 0) {
        await serviceClient.storage
          .from(BUCKET)
          .remove(oldFiles.map(f => `${user.id}/${f.name}`))
      }
    } catch (cleanupErr) {
      console.error("Old avatar cleanup failed:", cleanupErr)
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const storagePath = `${user.id}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await serviceClient.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      console.error("Avatar upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 })
    }

    const { data: urlData } = serviceClient.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)

    // Update profile with new avatar URL (use service client to bypass RLS)
    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", user.id)

    if (updateError) {
      console.error("Profile update error:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ avatar_url: urlData.publicUrl })
  } catch (err) {
    console.error("Avatar upload error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
