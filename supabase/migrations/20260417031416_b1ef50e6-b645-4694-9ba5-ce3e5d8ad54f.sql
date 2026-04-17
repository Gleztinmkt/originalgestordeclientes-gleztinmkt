CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove old job if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poll-telegram-updates') THEN
    PERFORM cron.unschedule('poll-telegram-updates');
  END IF;
END $$;

SELECT cron.schedule(
  'poll-telegram-updates',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rnwlqsnvswuecmqhsfww.supabase.co/functions/v1/telegram-poll',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJud2xxc252c3d1ZWNtcWhzZnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MjIzMzMsImV4cCI6MjA1MTE5ODMzM30.0BphzHhxCemowSATSx9zpU84abBGiDp-_yLv1EA-QC4"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);