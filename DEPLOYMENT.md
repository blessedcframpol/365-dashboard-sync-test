# Deployment Guide

This guide will walk you through deploying your Microsoft 365 File Management Interface to GitHub and Vercel.

## Prerequisites

- ✅ Git repository initialized (already done)
- ✅ GitHub account
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com) if needed)
- ✅ Supabase project set up
- ✅ Microsoft Graph API credentials configured

## Step 1: Push to GitHub

### 1.1 Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon in the top right corner
3. Select **New repository**
4. Fill in:
   - **Repository name**: `file-management-interface` (or your preferred name)
   - **Description**: "Microsoft 365 File Management Interface - MVP"
   - **Visibility**: Choose Private (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **Create repository**

### 1.2 Push Your Code

After creating the repository, GitHub will show you commands. Use these commands in your terminal:

```bash
# Add the remote repository (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Rename branch to main if needed (GitHub uses 'main' by default)
git branch -M main

# Push your code
git push -u origin main
```

**Alternative: Using SSH**
```bash
git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

### 1.3 Verify Upload

1. Go to your GitHub repository page
2. Verify all files are present
3. Check that sensitive files (`.env.local`, `node_modules`, etc.) are NOT visible

## Step 2: Deploy to Vercel

### 2.1 Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New...** → **Project**
3. Click **Import Git Repository**
4. Select your GitHub repository (`file-management-interface`)
5. Click **Import**

### 2.2 Configure Project Settings

Vercel will auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js (should be auto-detected)
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (or `pnpm build` if using pnpm)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (or `pnpm install`)

### 2.3 Add Environment Variables

Before deploying, add your environment variables:

1. In the **Environment Variables** section, add:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   ```
   Value: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)

   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
   Value: Your Supabase anonymous key

   ```
   SUPABASE_SERVICE_ROLE_KEY
   ```
   Value: Your Supabase service role key

   ```
   CRON_SECRET
   ```
   Value: A secure random string (generate one using: `openssl rand -hex 32` or any password generator)

2. Make sure all variables are set for **Production**, **Preview**, and **Development** environments (or at least Production)

### 2.4 Update Vercel Cron Configuration

1. After adding `CRON_SECRET`, update `vercel.json`:

   ```json
   {
     "crons": [
       {
         "path": "/api/sync?type=full&secret=YOUR_CRON_SECRET",
         "schedule": "0 */6 * * *"
       }
     ]
   }
   ```

   Replace `YOUR_CRON_SECRET` with the same value you set in environment variables.

2. Commit and push the change:
   ```bash
   git add vercel.json
   git commit -m "Update vercel.json with cron secret"
   git push
   ```

### 2.5 Deploy

1. Click **Deploy** button
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like: `https://your-project.vercel.app`

### 2.6 Verify Deployment

1. Visit your deployment URL
2. Check that the application loads correctly
3. Test key features:
   - Dashboard loads
   - Users page displays data
   - Licenses page works
   - Settings page accessible

## Step 3: Configure Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. Wait for DNS propagation (can take up to 24 hours)

## Step 4: Set Up Vercel Cron Jobs

Vercel Cron jobs are automatically configured via `vercel.json`. However, you need to:

1. **Verify the sync API route** accepts the secret parameter
2. **Update the sync route** to verify the secret (if not already done)

Check `app/api/sync/route.ts` and ensure it verifies the `CRON_SECRET`:

```typescript
const secret = searchParams.get('secret');
if (secret !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Step 5: Post-Deployment Checklist

- [ ] Application is accessible at Vercel URL
- [ ] All environment variables are set correctly
- [ ] Database connection works (check Supabase dashboard)
- [ ] Microsoft Graph API sync is working
- [ ] Cron jobs are scheduled (check Vercel dashboard → Cron Jobs)
- [ ] Error monitoring is set up (optional: integrate Sentry or similar)

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Common issues:
   - Missing environment variables
   - TypeScript errors (check `next.config.mjs` - we have `ignoreBuildErrors: true`)
   - Missing dependencies

### Application Doesn't Load

1. Check browser console for errors
2. Verify environment variables are set correctly
3. Check Supabase connection:
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
   - Check Supabase project is active

### Cron Jobs Not Running

1. Go to Vercel dashboard → Your Project → Cron Jobs
2. Verify the cron job is listed
3. Check the schedule matches `vercel.json`
4. Verify the API route accepts the secret parameter
5. Check function logs for errors

### Database Connection Issues

1. Verify Supabase project is active
2. Check environment variables match Supabase dashboard
3. Verify database migrations have been run
4. Check Supabase logs for connection errors

## Continuous Deployment

Once set up, Vercel will automatically deploy:
- **Production**: When you push to `main` branch
- **Preview**: When you push to other branches or create pull requests

## Updating Your Deployment

1. Make changes locally
2. Commit changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```
3. Vercel will automatically build and deploy

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `CRON_SECRET` | Optional | Secret for securing cron job endpoints |

## Security Best Practices

1. ✅ Never commit `.env.local` or any files with secrets
2. ✅ Use Vercel's environment variables for all secrets
3. ✅ Rotate secrets regularly
4. ✅ Use different secrets for production and development
5. ✅ Monitor Vercel logs for suspicious activity
6. ✅ Keep dependencies updated

## Next Steps

- Set up monitoring and error tracking (e.g., Sentry)
- Configure backup strategies for your database
- Set up staging environment
- Add CI/CD workflows for testing
- Configure analytics (Vercel Analytics is already included)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Review GitHub issues (if public) or contact support
4. Check Next.js and Vercel documentation
