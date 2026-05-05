
-- Add carousel media items column (array of {url, mime_type, drive_file_id, drive_file_name, storage_path})
ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS media_items jsonb DEFAULT '[]'::jsonb;
