# Quick Start Guide: Supabase Edge Functions

This is a condensed guide to get you up and running quickly.

## 1. Prerequisites Setup

### Supabase
- Create project at [supabase.com](https://supabase.com)
- Get your **Project URL** and **Service Role Key** from Settings > API
- Note your **Project Reference ID** from the URL

### Microsoft Graph API
- Create Azure AD app registration
- Get **Client ID**, **Tenant ID**, and **Client Secret**
- Grant permissions: `User.Read.All`, `Organization.Read.All`, `Reports.Read.All`
- Grant admin consent

## 2. Database Setup

1. Run the migration in Supabase SQL Editor:
   - Copy `supabase/migrations/001_initial_schema.sql`
   - Paste and execute

2. Enable extensions:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   CREATE EXTENSION IF NOT EXISTS http;
   ```

## 3. Deploy Edge Function

### Using Supabase Dashboard (Easiest)

1. Go to **Edge Functions** in your Supabase dashboard
2. Click **Create a new function**
3. Name: `sync-microsoft-graph`
4. Copy contents from `supabase/functions/sync-microsoft-graph/index.ts`
5. Go to **Settings** > **Edge Functions** > **Secrets**
6. Add these secrets:
   - `MICROSOFT_GRAPH_CLIENT_ID`
   - `MICROSOFT_GRAPH_CLIENT_SECRET`
   - `MICROSOFT_GRAPH_TENANT_ID`
   - `SUPABASE_URL` (your project URL)
   - `SUPABASE_SERVICE_ROLE_KEY`

### Using CLI (Alternative)

```bash
# Link project
npx supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
npx supabase secrets set MICROSOFT_GRAPH_CLIENT_ID=your_id
npx supabase secrets set MICROSOFT_GRAPH_CLIENT_SECRET=your_secret
npx supabase secrets set MICROSOFT_GRAPH_TENANT_ID=your_tenant
npx supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key

# Deploy
npx supabase functions deploy sync-microsoft-graph
```

## 4. Set Up Cron Job

1. Open Supabase SQL Editor
2. Copy `supabase/cron/sync-microsoft-graph.sql`
3. Replace:
   - `YOUR_PROJECT_REF` with your project reference
   - `YOUR_SERVICE_ROLE_KEY` with your service role key
4. Execute the SQL

## 5. Test It

**Manual trigger via Dashboard:**
- Edge Functions > `sync-microsoft-graph` > Invoke
- Body: `{"type": "full"}`

**Or via curl:**
```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-microsoft-graph?type=full' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

**Check results:**
- Table Editor > Check `users`, `licenses`, `sync_logs` tables

## Troubleshooting

- **Function not found**: Make sure it's deployed
- **Authentication error**: Check secrets are set correctly
- **No data**: Check `sync_logs` table for errors
- **Cron not running**: Verify pg_cron extension and check cron.job table

For detailed setup, see [README-SETUP.md](./README-SETUP.md)

