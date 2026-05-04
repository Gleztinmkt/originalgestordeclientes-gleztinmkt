ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS drive_file_name TEXT,
  ADD COLUMN IF NOT EXISTS drive_file_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS drive_file_size BIGINT;