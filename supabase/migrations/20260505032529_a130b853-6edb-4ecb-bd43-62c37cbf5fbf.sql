
-- Quitar job previo si existe
DO $$
BEGIN
  PERFORM cron.unschedule('meta-scheduler-every-minute');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'meta-scheduler-every-minute',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://rnwlqsnvswuecmqhsfww.supabase.co/functions/v1/meta-scheduler',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJud2xxc252c3d1ZWNtcWhzZnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MjIzMzMsImV4cCI6MjA1MTE5ODMzM30.0BphzHhxCemowSATSx9zpU84abBGiDp-_yLv1EA-QC4"}'::jsonb,
    body := '{}'::jsonb
  );
  $cron$
);
