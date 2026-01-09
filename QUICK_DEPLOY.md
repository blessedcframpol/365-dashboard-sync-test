# Quick Deploy Checklist

## ✅ Already Done
- [x] Git repository initialized
- [x] Initial commit made
- [x] README.md created
- [x] .env.example created
- [x] vercel.json configured

## 🚀 Next Steps

### 1. Push to GitHub (5 minutes)

```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel (10 minutes)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Add these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET` (generate a random string)
4. **IMPORTANT**: Update `vercel.json` - replace `YOUR_CRON_SECRET` with your actual CRON_SECRET value
5. Click **Deploy**

### 3. Update vercel.json After First Deploy

After setting `CRON_SECRET` in Vercel, update `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/sync?type=full&secret=YOUR_ACTUAL_SECRET_HERE",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Then commit and push:
```bash
git add vercel.json
git commit -m "Update cron secret"
git push
```

## 📚 Full Documentation

- See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
- See [README.md](./README.md) for project overview
