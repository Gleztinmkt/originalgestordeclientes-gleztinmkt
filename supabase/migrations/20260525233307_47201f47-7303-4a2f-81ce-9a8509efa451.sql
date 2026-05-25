DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-meta-storage-daily') THEN
    PERFORM cron.unschedule('cleanup-meta-storage-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'cleanup-meta-storage-daily',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rnwlqsnvswuecmqhsfww.supabase.co/functions/v1/cleanup-meta-storage',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJud2xxc252c3d1ZWNtcWhzZnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MjIzMzMsImV4cCI6MjA1MTE5ODMzM30.0BphzHhxCemowSATSx9zpU84abBGiDp-_yLv1EA-QC4"}'::jsonb,
    body := '{"days_old":7}'::jsonb
  ) AS request_id;
  $$
);