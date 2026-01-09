# Microsoft 365 File Management Interface

A modern Next.js application for managing and visualizing Microsoft 365 user data, licenses, mailbox usage, and OneDrive storage. Built with Next.js 16, Supabase, and Microsoft Graph API.

## Features

- 📊 **Dashboard Overview** - Real-time statistics and insights
- 👥 **User Management** - View and manage Microsoft 365 users
- 📧 **Mailbox Analytics** - Track mailbox storage and usage
- 💾 **OneDrive Analytics** - Monitor OneDrive storage consumption
- 🔐 **License Management** - Track license assignments and subscriptions
- 📈 **Reports** - Generate comprehensive usage reports
- ⚙️ **Settings** - Configure sync schedules and view sync logs

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **API Integration**: Microsoft Graph API
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ and npm/pnpm
- A Supabase account and project
- An Azure AD app registration with Microsoft Graph API permissions
- GitHub account (for version control)
- Vercel account (for deployment)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd file-management-interface
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)

### 4. Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_add_missing_columns.sql`
   - `supabase/migrations/003_add_user_licenses.sql`
   - `supabase/migrations/004_add_sku_product_mappings.sql`
   - `supabase/migrations/004_seed_sku_mappings.sql`

3. Enable required extensions:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   CREATE EXTENSION IF NOT EXISTS http;
   ```

### 5. Set Up Microsoft Graph API

1. Create an Azure AD app registration in [Azure Portal](https://portal.azure.com)
2. Configure API permissions:
   - `User.Read.All` (Application permission)
   - `Organization.Read.All` (Application permission)
   - `Reports.Read.All` (Application permission - optional)
3. Grant admin consent for your organization
4. Create a client secret and note down:
   - Client ID
   - Tenant ID
   - Client Secret

### 6. Deploy Supabase Edge Function

See [README-SETUP.md](./README-SETUP.md) for detailed instructions on deploying the sync Edge Function.

### 7. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Click "Deploy"

3. **Configure Vercel Cron Jobs** (Optional):
   - The `vercel.json` file includes a cron configuration
   - Update the `secret` parameter in `vercel.json` with a secure value
   - Add `CRON_SECRET` to your Vercel environment variables
   - Update the sync API route to verify the secret

### Environment Variables for Vercel

Add these in your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-secure-random-string
```

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── licenses/          # License management page
│   ├── mailboxes/         # Mailbox analytics page
│   ├── onedrive/          # OneDrive analytics page
│   ├── users/             # User management page
│   └── reports/           # Reports page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/                   # Utility functions and services
│   ├── supabase.ts       # Supabase client configuration
│   ├── microsoft-graph.ts # Microsoft Graph API client
│   └── dashboard-data.ts  # Data fetching functions
├── supabase/             # Supabase configuration
│   ├── migrations/       # Database migrations
│   ├── functions/        # Edge Functions
│   └── cron/             # Cron job SQL scripts
└── scripts/              # Utility scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run sync` - Manually trigger data sync
- `npm run import-sku-mappings` - Import SKU mappings from CSV
- `npm run update-license-names` - Update license display names

## Documentation

- [Setup Guide](./README-SETUP.md) - Detailed setup instructions for Supabase Edge Functions
- [Quick Start](./QUICK-START.md) - Condensed setup guide
- [SKU Mapping Architecture](./SKU_MAPPING_ARCHITECTURE.md) - SKU mapping system documentation
- [Import SKU Mappings](./IMPORT_SKU_MAPPINGS.md) - Guide for importing SKU mappings

## Security Notes

- Never commit `.env.local` or any files containing secrets
- Use Service Role Key only in server-side code
- Use Anon Key for client-side operations
- Regularly rotate API keys and secrets
- Monitor sync logs for suspicious activity

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue in the GitHub repository.
