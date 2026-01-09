-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  graph_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  user_principal_name TEXT,
  job_title TEXT,
  department TEXT,
  office_location TEXT,
  account_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_graph_user_id ON users(graph_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_synced ON users(last_synced_at);

-- Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id TEXT UNIQUE NOT NULL,
  sku_part_number TEXT,
  display_name TEXT,
  total_units INTEGER DEFAULT 0,
  consumed_units INTEGER DEFAULT 0,
  available_units INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for licenses table
CREATE INDEX IF NOT EXISTS idx_licenses_sku_id ON licenses(sku_id);
CREATE INDEX IF NOT EXISTS idx_licenses_last_synced ON licenses(last_synced_at);

-- Create mailbox_usage table
CREATE TABLE IF NOT EXISTS mailbox_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  graph_user_id TEXT,
  storage_used_bytes BIGINT DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  report_period TEXT,
  report_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, report_date)
);

-- Create indexes for mailbox_usage table
CREATE INDEX IF NOT EXISTS idx_mailbox_usage_user_id ON mailbox_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_mailbox_usage_graph_user_id ON mailbox_usage(graph_user_id);
CREATE INDEX IF NOT EXISTS idx_mailbox_usage_report_date ON mailbox_usage(report_date);

-- Create onedrive_usage table
CREATE TABLE IF NOT EXISTS onedrive_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  graph_user_id TEXT,
  storage_used_bytes BIGINT DEFAULT 0,
  storage_allocated_bytes BIGINT DEFAULT 0,
  file_count INTEGER DEFAULT 0,
  active_file_count INTEGER DEFAULT 0,
  report_period TEXT,
  report_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, report_date)
);

-- Create indexes for onedrive_usage table
CREATE INDEX IF NOT EXISTS idx_onedrive_usage_user_id ON onedrive_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_onedrive_usage_graph_user_id ON onedrive_usage(graph_user_id);
CREATE INDEX IF NOT EXISTS idx_onedrive_usage_report_date ON onedrive_usage(report_date);

-- Create sync_logs table to track sync operations
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- 'users', 'licenses', 'mailbox', 'onedrive', 'full'
  status TEXT NOT NULL, -- 'success', 'error', 'partial'
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER
);

-- Create index for sync_logs table
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mailbox_usage_updated_at BEFORE UPDATE ON mailbox_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onedrive_usage_updated_at BEFORE UPDATE ON onedrive_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

