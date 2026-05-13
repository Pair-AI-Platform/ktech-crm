import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createLogger, errorResponse } from "@/lib/logger"
import { validateUpload, sanitizeFilename } from "@/lib/upload-validation"

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
// Avatars: photo formats only. GIF dropped intentionally — Supabase Storage
// will render it, but animated GIFs in profile chrome are a poor UX and a
// known vector for visual spam.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}
const BUCKET = "avatars"

export async function POST(request: NextRequest) {
  const logger = createLogger("profile-avatar-upload")
  const supabase = await createServerSupabaseClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return errorResponse("Unauthorized", 401, logger)
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return errorResponse("No file provided", 400, logger)
    }

    const validation = validateUpload(file, {
      allowedMimeTypes: ALLOWED_TYPES,
      maxBytes: MAX_SIZE,
    })
    if (!validation.ok) {
      logger.warn("Avatar upload rejected", {
        userId: user.id,
        reason: validation.reason,
        status: validation.status,
        mime: file.type,
        size: file.size,
      })
      return errorResponse(validation.reason, validation.status, logger)
    }

    const serviceClient = createServiceRoleClient()

    // Ensure bucket exists
    const { data: buckets, error: listError } = await serviceClient.storage.listBuckets()
    if (listError) {
      logger.error("Failed to list buckets", { error: listError.message })
      return errorResponse("Storage not available", 500, logger)
    }
    const bucketExists = buckets?.some(b => b.name === BUCKET)
    if (!bucketExists) {
      const { error: createBucketError } = await serviceClient.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE,
      })
      if (createBucketError) {
        logger.error("Failed to create avatars bucket", { error: createBucketError.message })
        return errorResponse("Storage not available", 500, logger)
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
      logger.warn("Old avatar cleanup failed", {
        error: cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr),
      })
    }

    const ext = MIME_TO_EXT[file.type] || "jpg"
    // Sanitize defensively even though we own the path components.
    // user.id is a Supabase UUID, but we still strip slashes to make sure no
    // malformed value can ever traverse out of the user's directory.
    const safeUserId = sanitizeFilename(user.id)
    const storagePath = `${safeUserId}/${Date.now()}.${ext}`

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
      logger.error("Avatar upload error", { error: uploadError.message })
      return errorResponse("Failed to upload avatar", 500, logger)
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
      logger.error("Profile update error", { error: updateError.message })
      return errorResponse("Failed to update profile", 500, logger)
    }

    return NextResponse.json({ avatar_url: urlData.publicUrl })
  } catch (err) {
    logger.error("Avatar upload error", {
      error: err instanceof Error ? err.message : String(err),
    })
    return errorResponse("Internal server error", 500, logger)
  }
}
