# SKU Product Name Mapping Architecture

## Overview

The system uses a **hybrid approach** for mapping SKU part numbers to product names:
1. **Database table** (primary) - `sku_product_mappings` table in Supabase
2. **Code mapping** (fallback) - In-memory mapping in `lib/sku-product-mapping.ts`

## Why Database Table?

✅ **Advantages:**
- Can be updated without code deployment
- Can be managed by admins/non-developers via Supabase dashboard
- Can be synced from Microsoft's official CSV automatically
- Better for multi-tenant scenarios
- Can track when mappings were added/updated
- Can handle custom mappings per organization

✅ **Performance:**
- Uses in-memory caching (5-minute TTL)
- Batch lookups when possible
- Minimal database queries

## Database Schema

```sql
CREATE TABLE sku_product_mappings (
  id UUID PRIMARY KEY,
  sku_part_number TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  source TEXT DEFAULT 'manual', -- 'manual', 'microsoft_csv', 'microsoft_graph', 'code'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by TEXT,
  notes TEXT
);
```

## How It Works

1. **Primary Lookup**: Checks database table (cached in memory for 5 minutes)
2. **Fallback**: Uses code-based mapping if not found in database
3. **Final Fallback**: Formats SKU part number into readable name

## Usage

### Async (Recommended)
```typescript
import { getProductNameFromSku } from './lib/sku-product-mapping'

const productName = await getProductNameFromSku('ENTERPRISEPACK')
// Returns: "Microsoft 365 E3"
```

### Sync (Edge Cases Only)
```typescript
import { getProductNameFromSkuSync } from './lib/sku-product-mapping'

const productName = getProductNameFromSkuSync('ENTERPRISEPACK')
// Returns: "Microsoft 365 E3" (only uses code mapping)
```

## Seeding Initial Data

Run the migration and seed script:
```bash
# Migration creates the table
supabase/migrations/004_add_sku_product_mappings.sql

# Seed script populates initial mappings
supabase/migrations/004_seed_sku_mappings.sql
```

## Updating Mappings

### Via Supabase Dashboard
1. Go to Supabase Dashboard → Table Editor
2. Select `sku_product_mappings` table
3. Add/edit/delete mappings as needed

### Via SQL
```sql
-- Add a new mapping
INSERT INTO sku_product_mappings (sku_part_number, product_name, source)
VALUES ('NEW_SKU', 'New Product Name', 'manual')
ON CONFLICT (sku_part_number) DO UPDATE
SET product_name = EXCLUDED.product_name;

-- Deactivate a mapping
UPDATE sku_product_mappings
SET is_active = false
WHERE sku_part_number = 'OLD_SKU';
```

### Via Code (for bulk updates)
You can create a script to sync from Microsoft's CSV:
```typescript
// Example: Sync from Microsoft CSV
const csvData = await fetchMicrosoftSkuCsv()
for (const row of csvData) {
  await supabaseAdmin
    .from('sku_product_mappings')
    .upsert({
      sku_part_number: row.String_Id,
      product_name: row.Product_Display_Name,
      source: 'microsoft_csv'
    })
}
```

## Cache Management

The system automatically caches database mappings in memory for 5 minutes. To force a refresh:

```typescript
import { refreshSkuMappingCache } from './lib/sku-product-mapping'

await refreshSkuMappingCache() // Force reload from database
```

## Best Practices

1. **Always use async version** (`getProductNameFromSku`) for database lookups
2. **Use sync version** (`getProductNameFromSkuSync`) only when async isn't possible
3. **Update database** when Microsoft releases new SKUs
4. **Keep code mapping** as comprehensive fallback
5. **Monitor cache performance** - adjust TTL if needed

## Future Enhancements

- [ ] Automatic sync from Microsoft's CSV file
- [ ] Admin UI for managing mappings
- [ ] Version history for mapping changes
- [ ] Custom mappings per tenant/organization
- [ ] API endpoint for bulk updates
