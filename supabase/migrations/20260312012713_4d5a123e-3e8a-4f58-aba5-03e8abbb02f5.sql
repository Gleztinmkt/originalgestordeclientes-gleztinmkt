-- Remove all notification-related triggers
DROP FUNCTION IF EXISTS public.generate_recording_notifications() CASCADE;
DROP FUNCTION IF EXISTS public.generate_task_notifications() CASCADE;
DROP FUNCTION IF EXISTS public.generate_payment_notifications() CASCADE;
DROP FUNCTION IF EXISTS public.generate_publication_notifications() CASCADE;

-- Truncate the notifications table
TRUNCATE TABLE public.notifications;