-- 1. Liberar espacio inmediato con TRUNCATE (libera espacio físico sin VACUUM)
TRUNCATE TABLE cron.job_run_details;
TRUNCATE TABLE net._http_response;

-- 2. Programar limpieza automática diaria (mantiene últimos 3 días)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-cron-history-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-http-response-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-cron-history-daily',
  '30 3 * * *',
  $$DELETE FROM cron.job_run_details WHERE start_time < now() - interval '3 days';$$
);

SELECT cron.schedule(
  'cleanup-http-response-daily',
  '35 3 * * *',
  $$DELETE FROM net._http_response WHERE created < now() - interval '3 days';$$
);