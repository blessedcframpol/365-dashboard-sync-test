-- Migration to add SKU product mappings table
-- This table stores the mapping between SKU part numbers and product display names
-- Based on Microsoft's official licensing service plan reference

-- Create sku_product_mappings table
CREATE TABLE IF NOT EXISTS sku_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_part_number TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  source TEXT DEFAULT 'manual', -- 'manual', 'microsoft_csv', 'microsoft_graph'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  notes TEXT
);

-- Create indexes for sku_product_mappings table
CREATE INDEX IF NOT EXISTS idx_sku_mappings_sku_part_number ON sku_product_mappings(sku_part_number);
CREATE INDEX IF NOT EXISTS idx_sku_mappings_is_active ON sku_product_mappings(is_active);
CREATE INDEX IF NOT EXISTS idx_sku_mappings_source ON sku_product_mappings(source);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_sku_mappings_updated_at BEFORE UPDATE ON sku_product_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to get product name from SKU (for use in queries)
CREATE OR REPLACE FUNCTION get_product_name_from_sku(sku_part_number TEXT)
RETURNS TEXT AS $$
DECLARE
  product_name TEXT;
BEGIN
  SELECT sku_product_mappings.product_name INTO product_name
  FROM sku_product_mappings
  WHERE sku_product_mappings.sku_part_number = get_product_name_from_sku.sku_part_number
    AND sku_product_mappings.is_active = true
  LIMIT 1;
  
  RETURN COALESCE(product_name, sku_part_number);
END;
$$ LANGUAGE plpgsql STABLE;
