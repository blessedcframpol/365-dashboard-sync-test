-- Add missing SKU mappings that weren't found in the CSV import
-- These might be newer SKUs or have formatting differences

-- Windows 365 Enterprise 8 vCPU 32 GB 512 GB (exists in CSV but may have formatting issue)
INSERT INTO sku_product_mappings (sku_part_number, product_name, source, notes)
VALUES 
  ('CPC_E_8C_32GB_512GB', 'Windows 365 Enterprise 8 vCPU 32 GB 512 GB', 'manual', 'Added manually - exists in CSV but had formatting issue')
ON CONFLICT (sku_part_number) DO UPDATE
SET product_name = EXCLUDED.product_name,
    source = 'manual',
    notes = 'Updated manually - exists in CSV but had formatting issue';

-- Microsoft Teams Enterprise New (may be a newer SKU)
INSERT INTO sku_product_mappings (sku_part_number, product_name, source, notes)
VALUES 
  ('MICROSOFT_TEAMS_ENTERPRISE_NEW', 'Microsoft Teams Enterprise', 'manual', 'Added manually - newer SKU not in CSV')
ON CONFLICT (sku_part_number) DO UPDATE
SET product_name = EXCLUDED.product_name,
    source = 'manual',
    notes = 'Updated manually - newer SKU not in CSV';

-- Microsoft Copilot for Finance (may be a newer SKU)
INSERT INTO sku_product_mappings (sku_part_number, product_name, source, notes)
VALUES 
  ('MICROSOFTCOPILOT_FOR_FINANCE', 'Microsoft Copilot for Finance', 'manual', 'Added manually - newer SKU not in CSV')
ON CONFLICT (sku_part_number) DO UPDATE
SET product_name = EXCLUDED.product_name,
    source = 'manual',
    notes = 'Updated manually - newer SKU not in CSV';
