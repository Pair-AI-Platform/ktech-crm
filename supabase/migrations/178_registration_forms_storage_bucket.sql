-- Private bucket holding registration form templates (Application.pdf, Preferences.pdf)
-- attached to the "Sent to Registration" email. Admin-managed; agents only need read.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('registration-forms', 'registration-forms', false, 26214400) -- 25 MB
ON CONFLICT (id) DO NOTHING;

-- Authenticated users (agents + admins) can read the templates
CREATE POLICY "Authenticated read registration forms"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'registration-forms');

-- Only admins can upload/replace forms (service role bypasses these anyway)
CREATE POLICY "Admins insert registration forms"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'registration-forms'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins update registration forms"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'registration-forms'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins delete registration forms"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'registration-forms'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
