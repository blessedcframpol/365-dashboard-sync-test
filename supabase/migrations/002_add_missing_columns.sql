-- Migration to add missing columns from Microsoft Graph API data

-- Add missing columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS mobile_phone TEXT,
  ADD COLUMN IF NOT EXISTS business_phones TEXT[],
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS created_date_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS mail_nickname TEXT;

-- Add missing columns to licenses table
ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS capability_status JSONB,
  ADD COLUMN IF NOT EXISTS applies_to TEXT;

-- Add missing columns to mailbox_usage table
ALTER TABLE mailbox_usage
  ADD COLUMN IF NOT EXISTS report_refresh_date DATE,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_date DATE,
  ADD COLUMN IF NOT EXISTS created_date DATE,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE,
  ADD COLUMN IF NOT EXISTS issue_warning_quota_bytes BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prohibit_send_quota_bytes BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prohibit_send_receive_quota_bytes BIGINT DEFAULT 0;

-- Add missing columns to onedrive_usage table
ALTER TABLE onedrive_usage
  ADD COLUMN IF NOT EXISTS report_refresh_date DATE,
  ADD COLUMN IF NOT EXISTS site_url TEXT,
  ADD COLUMN IF NOT EXISTS owner_display_name TEXT,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_mailbox_usage_report_refresh_date ON mailbox_usage(report_refresh_date);
CREATE INDEX IF NOT EXISTS idx_mailbox_usage_last_activity_date ON mailbox_usage(last_activity_date);
CREATE INDEX IF NOT EXISTS idx_onedrive_usage_report_refresh_date ON onedrive_usage(report_refresh_date);
CREATE INDEX IF NOT EXISTS idx_onedrive_usage_last_activity_date ON onedrive_usage(last_activity_date);
CREATE INDEX IF NOT EXISTS idx_users_created_date_time ON users(created_date_time);
