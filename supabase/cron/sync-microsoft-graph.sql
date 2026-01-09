-- Supabase Cron Job to trigger the sync-microsoft-graph Edge Function
-- This runs every 6 hours

-- Supabase Cron Job to trigger the sync-microsoft-graph Edge Function
-- This runs every 6 hours

-- First, enable the required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the Edge Function to run every 6 hours
-- Replace 'YOUR_PROJECT_REF' with your actual Supabase project reference ID
-- You can find this in your Supabase dashboard URL: https://app.supabase.com/project/YOUR_PROJECT_REF
-- Replace 'YOUR_SERVICE_ROLE_KEY' with your actual service role key from Settings > API

SELECT cron.schedule(
  'sync-microsoft-graph',                    -- Job name
  '0 */6 * * *',                            -- Schedule: Every 6 hours (cron syntax)
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-microsoft-graph?type=full',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Alternative: If pg_net is not available, you can use the http extension instead:
-- CREATE EXTENSION IF NOT EXISTS http;
-- Then use: SELECT http_post(...) instead of net.http_post(...)

-- To unschedule the job later, use:
-- SELECT cron.unschedule('sync-microsoft-graph');

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To view job run history:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-microsoft-graph');

