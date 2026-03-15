
-- Table to store bulk callback data for Telegram inline buttons (avoids 64-byte limit)
CREATE TABLE public.telegram_sessions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-delete expired sessions (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_telegram_sessions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.telegram_sessions WHERE created_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_telegram_sessions
  AFTER INSERT ON public.telegram_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_telegram_sessions();

-- RLS: allow all access (edge function uses service role)
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.telegram_sessions
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);
