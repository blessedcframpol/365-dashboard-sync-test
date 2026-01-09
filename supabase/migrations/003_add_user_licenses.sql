-- Migration to add user_licenses junction table for tracking license assignments

-- Create user_licenses junction table
CREATE TABLE IF NOT EXISTS user_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  sku_id TEXT NOT NULL, -- Store SKU ID for reference (from Microsoft Graph)
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sku_id) -- Prevent duplicate license assignments
);

-- Create indexes for user_licenses table
CREATE INDEX IF NOT EXISTS idx_user_licenses_user_id ON user_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_license_id ON user_licenses(license_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_sku_id ON user_licenses(sku_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_last_synced ON user_licenses(last_synced_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_licenses_updated_at BEFORE UPDATE ON user_licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view to easily query users with multiple licenses
CREATE OR REPLACE VIEW users_with_multiple_licenses AS
SELECT 
  u.id,
  u.graph_user_id,
  u.display_name,
  u.email,
  u.user_principal_name,
  COUNT(ul.id) as license_count,
  ARRAY_AGG(l.display_name ORDER BY l.display_name) as license_names,
  ARRAY_AGG(l.sku_part_number ORDER BY l.sku_part_number) as sku_part_numbers,
  MAX(ul.last_synced_at) as licenses_last_synced_at
FROM users u
INNER JOIN user_licenses ul ON u.id = ul.user_id
INNER JOIN licenses l ON ul.license_id = l.id
GROUP BY u.id, u.graph_user_id, u.display_name, u.email, u.user_principal_name
HAVING COUNT(ul.id) > 1
ORDER BY license_count DESC, u.display_name;
