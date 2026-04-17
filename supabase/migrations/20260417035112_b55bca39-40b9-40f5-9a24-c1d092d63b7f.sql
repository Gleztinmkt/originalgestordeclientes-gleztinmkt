-- Asegurar que los UPDATE/DELETE envíen la fila completa por realtime
ALTER TABLE public.publications REPLICA IDENTITY FULL;

-- Agregar la tabla a la publicación de realtime (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'publications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.publications';
  END IF;
END $$;