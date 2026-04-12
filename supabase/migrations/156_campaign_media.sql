-- Migration: Add media support to campaigns (pictures/videos)

-- Add media columns to campaigns table
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', NULL));

-- Create campaign-media storage bucket (10MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-media',
  'campaign-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload campaign media
CREATE POLICY "Authenticated users can upload campaign media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-media');

-- Allow authenticated users to delete campaign media
CREATE POLICY "Authenticated users can delete campaign media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-media');

-- Allow public read access to campaign media
CREATE POLICY "Public campaign media read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'campaign-media');
