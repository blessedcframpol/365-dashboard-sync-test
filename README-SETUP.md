# Setup Guide: Supabase Edge Functions + Microsoft Graph API Integration

This guide will help you set up Supabase database with Edge Functions to automate data syncing from Microsoft Graph API.

## Why Supabase Edge Functions?

- ✅ **Built-in cron scheduling** - No need for external cron services
- ✅ **Secure secrets management** - Secrets stored in Supabase dashboard
- ✅ **Independent execution** - Runs separately from your Next.js app
- ✅ **Better performance** - Runs closer to your database
- ✅ **Cost-effective** - Included in Supabase plans

## Prerequisites

1. A Supabase account and project
2. An Azure AD app registration with Microsoft Graph API permissions
3. Supabase CLI installed (for local development)
4. Node.js and npm installed

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is created, go to **Settings** > **API**
3. Copy your:
   - Project URL (you'll need this for the Edge Function)
   - Service Role Key (SUPABASE_SERVICE_ROLE_KEY) - Keep this secret!
   - Project Reference ID (found in your project URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`)

4. Run the database migrations:
   - Go to **SQL Editor** in your Supabase dashboard
   - Run migrations in order:
     1. Copy and run `supabase/migrations/001_initial_schema.sql`
     2. Copy and run `supabase/migrations/002_add_missing_columns.sql`
     3. Copy and run `supabase/migrations/003_add_user_licenses.sql` (for tracking license assignments)

5. Enable pg_cron extension (for scheduled jobs):
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

## Step 2: Set Up Microsoft Graph API

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in:
   - Name: Your app name
   - Supported account types: Accounts in this organizational directory only
   - Redirect URI: Leave blank for now
5. Click **Register**

6. After registration, note down:
   - **Application (client) ID** → `MICROSOFT_GRAPH_CLIENT_ID`
   - **Directory (tenant) ID** → `MICROSOFT_GRAPH_TENANT_ID`

7. Go to **Certificates & secrets**
   - Click **New client secret**
   - Add description and expiration
   - Copy the **Value** (this is your `MICROSOFT_GRAPH_CLIENT_SECRET`)

8. Go to **API permissions**
   - Click **Add a permission**
   - Select **Microsoft Graph**
   - Choose **Application permissions** (not Delegated)
   - Add the following permissions:
     - `User.Read.All` - Read all users' full profiles
     - `Organization.Read.All` - Read organization information
     - `Reports.Read.All` - Read all usage reports (optional, for usage stats)
   - Click **Add permissions**
   - Click **Grant admin consent** for your organization

## Step 3: Deploy the Edge Function

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
   - **Windows (Scoop):** `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase`
   - **macOS (Homebrew):** `brew install supabase/tap/supabase`
   - **Linux:** Download from [GitHub Releases](https://github.com/supabase/cli/releases)
   - **Or use npx:** `npx supabase@latest` (no installation needed)

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Set Edge Function secrets:
   ```bash
   npx supabase secrets set MICROSOFT_GRAPH_CLIENT_ID=your-client-id-here
   npx supabase secrets set MICROSOFT_GRAPH_CLIENT_SECRET=your-client-secret-here
   npx supabase secrets set MICROSOFT_GRAPH_TENANT_ID=your-tenant-id-here
   npx supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

5. Deploy the Edge Function:
   ```bash
   supabase functions deploy sync-microsoft-graph
   ```

### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions**
3. Click **Create a new function**
4. Name it `sync-microsoft-graph`
5. Copy the contents of `supabase/functions/sync-microsoft-graph/index.ts` into the editor
6. Set the following secrets in **Settings** > **Edge Functions** > **Secrets**:
   - `MICROSOFT_GRAPH_CLIENT_ID`
   - `MICROSOFT_GRAPH_CLIENT_SECRET`
   - `MICROSOFT_GRAPH_TENANT_ID`
   - `SUPABASE_URL` (your project URL)
   - `SUPABASE_SERVICE_ROLE_KEY`

## Step 4: Set Up Automated Scheduling

### Using Supabase Cron (pg_cron)

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/cron/sync-microsoft-graph.sql`
3. **Important**: Replace `YOUR_PROJECT_REF` with your actual project reference ID
4. Replace the service role key placeholder with your actual service role key, or use:
   ```sql
   current_setting('app.settings.service_role_key', true)
   ```
5. Run the SQL script

The cron job will now run every 6 hours automatically.

### Manual Trigger (Testing)

You can manually trigger the Edge Function:

1. **Via Supabase Dashboard:**
   - Go to **Edge Functions** > `sync-microsoft-graph`
   - Click **Invoke** with body: `{"type": "full"}`

2. **Via curl:**
   ```bash
   curl -X POST \
     'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-microsoft-graph?type=full' \
     -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
     -H 'Content-Type: application/json'
   ```

3. **Via PowerShell:**
   ```powershell
   $headers = @{
       "Authorization" = "Bearer YOUR_SERVICE_ROLE_KEY"
       "Content-Type" = "application/json"
   }
   Invoke-WebRequest -Uri "https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-microsoft-graph?type=full" -Method POST -Headers $headers
   ```
   
   Or use the provided script:
   ```powershell
   .\invoke-sync.ps1
   ```
   (Edit the script first to add your project reference and service role key)

## Step 5: Verify the Setup

1. Check your Supabase database:
   - Go to **Table Editor** in Supabase dashboard
   - Check the `users`, `licenses`, `mailbox_usage`, and `onedrive_usage` tables
   - Check the `sync_logs` table to see sync history

2. Check cron job status:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'sync-microsoft-graph';
   ```

3. Check cron job run history:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-microsoft-graph')
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

## Edge Function API

The Edge Function accepts a `type` query parameter:

- `type=full` (default) - Syncs all data types
- `type=users` - Syncs only users
- `type=licenses` - Syncs only licenses
- `type=user-licenses` - Syncs only user license assignments (requires users and licenses to be synced first)
- `type=mailbox` - Syncs only mailbox usage
- `type=onedrive` - Syncs only OneDrive usage

**Example:**
```bash
# Sync all data
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-microsoft-graph?type=full' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'

# Sync only users
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-microsoft-graph?type=users' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

## Database Schema

The migration creates the following tables:

- **users**: Microsoft 365 user information
- **licenses**: License/subscription information
- **user_licenses**: Junction table tracking which licenses are assigned to which users
- **mailbox_usage**: Mailbox storage and usage statistics
- **onedrive_usage**: OneDrive storage and usage statistics
- **sync_logs**: Logs of all sync operations

### Views

- **users_with_multiple_licenses**: View showing users who have more than one license assigned, including license names and counts

## Troubleshooting

### Error: "Missing Supabase configuration"
- Make sure all secrets are set in Supabase Edge Functions settings
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct

### Error: "Missing Microsoft Graph API credentials"
- Verify all Microsoft Graph secrets are set correctly
- Check that your Azure app has the correct permissions

### Error: "Failed to get access token"
- Verify your `MICROSOFT_GRAPH_CLIENT_SECRET` is correct
- Check that admin consent has been granted for API permissions
- Ensure your app registration is in the correct tenant

### Cron job not running
- Verify pg_cron extension is enabled: `CREATE EXTENSION IF NOT EXISTS pg_cron;`
- Check the cron job exists: `SELECT * FROM cron.job;`
- Review cron job logs: `SELECT * FROM cron.job_run_details;`
- Make sure the project reference ID and service role key are correct in the cron SQL

### No data syncing
- Check the `sync_logs` table in Supabase for error messages
- Verify API permissions in Azure AD
- Check Edge Function logs in Supabase dashboard

## Managing the Cron Schedule

### Update the schedule:
```sql
-- Change to run every 3 hours instead of 6
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'sync-microsoft-graph'),
  schedule := '0 */3 * * *'
);
```

### Pause the cron job:
```sql
SELECT cron.unschedule('sync-microsoft-graph');
```

### Resume the cron job:
```sql
-- Re-run the cron setup SQL from supabase/cron/sync-microsoft-graph.sql
```

### View cron job details:
```sql
SELECT * FROM cron.job WHERE jobname = 'sync-microsoft-graph';
```

## Security Notes

1. **Never commit** secrets to version control
2. Use **Service Role Key** only in Edge Functions (server-side)
3. Use **Anon Key** for client-side operations in your Next.js app
4. Regularly rotate your Microsoft Graph client secret
5. Monitor Edge Function logs for any suspicious activity

## Next Steps

- Customize the sync frequency based on your needs
- Add more Microsoft Graph API endpoints as needed
- Set up monitoring and alerts for sync failures
- Create dashboards to visualize the synced data
- Integrate the synced data into your Next.js application

## Local Development

To test the Edge Function locally:

1. Start Supabase locally:
   ```bash
   supabase start
   ```

2. Set local secrets:
   ```bash
   supabase secrets set MICROSOFT_GRAPH_CLIENT_ID=your_client_id --env-file .env.local
   # ... (set other secrets)
   ```

3. Serve the function locally:
   ```bash
   supabase functions serve sync-microsoft-graph
   ```

4. Test it:
   ```bash
   curl -X POST 'http://localhost:54321/functions/v1/sync-microsoft-graph?type=full' \
     -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
   ```
