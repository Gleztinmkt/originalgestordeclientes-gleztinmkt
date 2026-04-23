ALTER TABLE public.publication_planning 
ADD COLUMN IF NOT EXISTS production_status text DEFAULT 'sin_hacer';