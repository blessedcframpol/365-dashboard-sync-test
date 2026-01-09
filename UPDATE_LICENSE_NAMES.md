# Update License Display Names

This script updates all existing licenses in your database with proper product names from the SKU mappings table.

## Quick Start

```bash
npm run update-license-names
```

Or directly:
```bash
npx tsx scripts/update-license-display-names.ts
```

## What It Does

1. **Fetches all licenses** from the `licenses` table
2. **Looks up product names** from the `sku_product_mappings` table for each license
3. **Updates licenses** that have:
   - Missing `display_name` (null or empty)
   - Incorrect `display_name` (doesn't match the mapping)
4. **Skips licenses** that already have the correct product name

## When to Use

- **After importing SKU mappings** from CSV
- **After adding new mappings** to the database
- **To fix licenses** that are showing SKU part numbers instead of product names
- **Periodically** to ensure all licenses have proper names

## Output

The script shows:
- Number of licenses updated
- Number of licenses skipped (already correct)
- Number of licenses with no mapping found
- Sample of updated licenses (first 20)

## Example Output

```
Fetching all licenses from database...
Found 15 licenses to check

================================================================================
📊 Update Summary
================================================================================
✅ Updated: 12
⏭️  Skipped (already correct): 2
❌ No mapping found: 1
📝 Total licenses: 15

================================================================================
📋 Updated Licenses (showing first 20):
================================================================================

SKU: ENTERPRISEPACK
  Old: ENTERPRISEPACK
  New: Microsoft 365 E3

SKU: EXCHANGESTANDARD
  Old: (empty)
  New: Exchange Online (Plan 1)

...

✨ Done! All licenses have been updated with proper product names.
   The changes will be visible immediately in your application.
```

## Notes

- The script is **safe to run multiple times** - it only updates what needs updating
- Licenses without mappings will be skipped (they'll use fallback names)
- Changes are **immediate** - no cache refresh needed for database updates
- The application will automatically use the updated `display_name` values
