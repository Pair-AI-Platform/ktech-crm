"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// Student photos are stored as a profile-level row in the existing psp_documents
// table (no schema change needed). The file lives in the shared "documents"
// bucket under leads/<id>/student-photo/ so it is visible to everyone on every
// device, just like the other PUC documents.
const BUCKET = "documents"
const DOC_TYPE = "student_photo"
const GRADUATE_TYPE = "_profile"
const MAX_BYTES = 15 * 1024 * 1024

type Status = "loading" | "idle" | "processing" | "uploading"

// SVG fallback shown until a real photo is uploaded — mirrors the gender-aware
// stick figure used elsewhere in the lead header.
function StickFigureAvatar({ gender }: { gender?: string | null }) {
  const isFemale = gender?.toLowerCase() === "female"
  return (
    <svg viewBox="0 0 80 80" className="h-12 w-12" fill="none" aria-hidden="true">
      {isFemale ? (
        <>
          <path d="M27 28c0-10 6.5-18 13-18s13 8 13 18" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="40" cy="27" r="10" stroke="currentColor" strokeWidth="4.5" />
          <path d="M23 64c0-13 7.5-21 17-21s17 8 17 21" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M30 45c4 3.5 16 3.5 20 0" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M29 20c2-6 20-6 22 0" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="40" cy="27" r="11" stroke="currentColor" strokeWidth="4.5" />
          <path d="M19 65c0-12 9.5-19 21-19s21 7 21 19" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M31 47c5 4 13 4 18 0" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

// Flatten a transparent cutout onto an opaque white background and return a JPEG.
async function compositeOnWhite(cutout: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(cutout)
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close?.()
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode image"))),
      "image/jpeg",
      0.92
    )
  })
}

interface StudentPhotoAvatarProps {
  leadId: string
  gender?: string | null
  /** When false, the avatar is display-only (no upload affordance). */
  canEdit?: boolean
}

export function StudentPhotoAvatar({ leadId, gender, canEdit = true }: StudentPhotoAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>("loading")
  const inputRef = useRef<HTMLInputElement>(null)

  const isFemale = gender?.toLowerCase() === "female"
  const busy = status === "processing" || status === "uploading"

  // Load any existing student photo for this lead.
  useEffect(() => {
    let active = true
    setStatus("loading")
    setPhotoUrl(null)
    ;(async () => {
      try {
        const res = await fetch(`/api/psp/documents?lead_id=${leadId}&graduate_type=${GRADUATE_TYPE}`)
        if (res.ok) {
          const data = await res.json()
          const found = (data.documents || []).find(
            (d: { document_type: string; public_url: string | null }) => d.document_type === DOC_TYPE
          )
          if (active && found?.public_url) setPhotoUrl(found.public_url)
        }
      } catch {
        // Non-fatal: fall back to the placeholder avatar.
      } finally {
        if (active) setStatus("idle")
      }
    })()
    return () => {
      active = false
    }
  }, [leadId])

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file (JPG, PNG, or WebP).")
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    if (file.size > MAX_BYTES) {
      alert("Image is too large. Maximum size is 15MB.")
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    const supabase = createClient()
    try {
      // 1. Remove the original background, then flatten onto white.
      setStatus("processing")
      const { removeBackground } = await import("@imgly/background-removal")
      const cutout = await removeBackground(file)
      const whiteBlob = await compositeOnWhite(cutout)

      // 2. Upload the white-background JPEG to shared document storage.
      setStatus("uploading")
      const timestamp = Date.now()
      const storagePath = `leads/${leadId}/student-photo/${timestamp}.jpg`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, whiteBlob, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/jpeg",
        })
      if (uploadError) {
        if (uploadError.message.includes("Bucket not found")) {
          alert("Document storage is not configured. Please contact support.")
          return
        }
        throw uploadError
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

      // 3. Persist the record so it shows on every device.
      const response = await fetch("/api/psp/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          document_type: DOC_TYPE,
          graduate_type: GRADUATE_TYPE,
          file_name: "student-photo.jpg",
          file_type: "image/jpeg",
          file_size: whiteBlob.size,
          storage_path: storagePath,
          public_url: urlData?.publicUrl,
        }),
      })
      if (!response.ok) throw new Error("Failed to save photo record")

      // Cache-bust so the freshly uploaded photo replaces the old one immediately.
      setPhotoUrl(urlData?.publicUrl ? `${urlData.publicUrl}?t=${timestamp}` : null)
    } catch (err) {
      console.error("Student photo processing failed:", err)
      alert("Could not process the image. Please try a different photo.")
    } finally {
      setStatus("idle")
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <button
      type="button"
      onClick={() => canEdit && !busy && inputRef.current?.click()}
      disabled={!canEdit || busy}
      aria-label={photoUrl ? "Change student photo" : "Upload student photo"}
      title={canEdit ? "Click to upload a photo — the background becomes white automatically" : undefined}
      className={cn(
        "group relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border shadow-sm transition",
        canEdit && !busy && "cursor-pointer",
        isFemale
          ? "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-600 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/25 dark:text-fuchsia-300"
          : "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/25 dark:text-blue-300"
      )}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="Student" className="h-full w-full object-cover" />
      ) : (
        <StickFigureAvatar gender={gender} />
      )}

      {/* Hover affordance — only when editable and not busy. */}
      {canEdit && !busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-4 w-4 text-white" />
        </span>
      )}

      {/* Processing / uploading overlay. */}
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/55">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleSelect}
      />
    </button>
  )
}
