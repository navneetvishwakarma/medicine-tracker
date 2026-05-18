-- Schedule send-reminders Edge Function every 15 minutes via pg_cron
-- Requires pg_cron extension (enabled by default in Supabase projects)
select cron.schedule(
  'send-reminders',
  '*/15 * * * *',
  $$
    select net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    )
  $$
);
