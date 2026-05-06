ALTER TABLE public.publications
ADD COLUMN IF NOT EXISTS cover_thumb_offset integer;

COMMENT ON COLUMN public.publications.cover_thumb_offset IS 'Segundo del video/Reel usado como portada en Meta. Null usa portada automática.';