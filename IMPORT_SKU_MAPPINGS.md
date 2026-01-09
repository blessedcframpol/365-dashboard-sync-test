# Importing SKU Mappings from Microsoft CSV

This guide explains how to import all SKU product mappings from Microsoft's official CSV file into your database.

## Prerequisites

1. **CSV File**: The file `Product names and service plan identifiers for licensing.csv` should be in the project root directory
2. **Environment Variables**: Make sure you have your Supabase credentials set:
   - `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Quick Start

### Option 1: Using npm script (Recommended)

```bash
npm run import-sku-mappings
```

### Option 2: Using tsx directly

```bash
npx tsx scripts/import-sku-mappings-from-csv.ts
```

## What the Script Does

1. **Reads the CSV file** from the project root
2. **Parses all rows** and extracts unique SKU part number to product name mappings
3. **Imports into database** using batch upserts (100 records at a time)
4. **Handles duplicates** - updates existing mappings if they exist
5. **Marks source** as `microsoft_csv` for tracking

## CSV File Structure

The script expects a CSV file with these columns:
- `Product_Display_Name` - The product name
- `String_Id` - The SKU part number (this is what we map)

Other columns are ignored but can be present.

## Output

The script will show:
- Number of rows parsed from CSV
- Number of unique SKU part numbers found
- Sample mappings (first 10)
- Progress during import
- Final statistics (total processed, successful, errors)

## Example Output

```
Reading CSV file: /path/to/Product names and service plan identifiers for licensing.csv
Parsed 5826 rows from CSV
Found 1234 unique SKU part numbers

Sample mappings (first 10):
  ENTERPRISEPACK → Microsoft 365 E3
  ENTERPRISEPREMIUM → Microsoft 365 E5
  EXCHANGESTANDARD → Exchange Online (Plan 1)
  ...

Ready to import 1234 unique SKU mappings.
This will update existing mappings and add new ones.

Importing 1234 SKU mappings into database...
  Progress: 100/1234
  Progress: 200/1234
  ...
  Progress: 1234/1234

✅ Import complete!
   - Total processed: 1234
   - Successful: 1234
   - Errors: 0

✨ Done! SKU mappings have been imported into the database.
The cache will automatically refresh on the next lookup.
```

## Troubleshooting

### Error: CSV file not found
- Make sure the CSV file is in the project root directory
- Check the filename matches exactly: `Product names and service plan identifiers for licensing.csv`

### Error: Missing Supabase credentials
- Set `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL` environment variable
- Set `SUPABASE_SERVICE_ROLE_KEY` environment variable
- You can create a `.env.local` file with these values

### Error: Missing required columns
- The CSV must have `Product_Display_Name` and `String_Id` columns
- Check that the CSV header row is correct

### Import is slow
- This is normal for large CSV files (5000+ rows)
- The script processes in batches of 100 for optimal performance
- Progress indicators show every 500 records

## After Import

Once imported:
1. **Mappings are immediately available** - The cache will refresh automatically
2. **Check in Supabase Dashboard** - Go to Table Editor → `sku_product_mappings` to verify
3. **Update if needed** - You can manually edit any mappings in the dashboard

## Updating Mappings

To update mappings after Microsoft releases a new CSV:

1. Download the latest CSV from Microsoft
2. Replace the file in your project root
3. Run the import script again
4. The script will update existing mappings and add new ones

## Notes

- The script uses `upsert` so it's safe to run multiple times
- Existing mappings with `source='code'` or `source='manual'` will be updated to `source='microsoft_csv'`
- If you want to preserve manual mappings, update them after import with `source='manual'`
