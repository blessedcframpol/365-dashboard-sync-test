/**
 * Script to import SKU product mappings from Microsoft's official CSV file
 * 
 * Usage:
 *   npx tsx scripts/import-sku-mappings-from-csv.ts
 * 
 * This script:
 * 1. Reads the CSV file
 * 2. Extracts unique SKU part number to product name mappings
 * 3. Imports them into the sku_product_mappings table
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local if it exists
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
  })
}

interface CsvRow {
  Product_Display_Name: string
  String_Id: string
  GUID: string
  Service_Plan_Name?: string
  Service_Plan_Id?: string
  Service_Plans_Included_Friendly_Names?: string
}

interface SkuMapping {
  sku_part_number: string
  product_name: string
}

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Simple CSV parser that handles quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current.trim())
  return result
}

/**
 * Parse CSV file and extract unique SKU mappings
 */
function parseCsvFile(filePath: string): SkuMapping[] {
  console.log(`Reading CSV file: ${filePath}`)
  
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const lines = fileContent.split('\n').filter(line => line.trim())
  
  if (lines.length < 2) {
    throw new Error('CSV file appears to be empty or invalid')
  }

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''))
  const productNameIdx = headers.indexOf('Product_Display_Name')
  const stringIdIdx = headers.indexOf('String_Id')

  if (productNameIdx === -1 || stringIdIdx === -1) {
    throw new Error('CSV file missing required columns: Product_Display_Name or String_Id')
  }

  // Parse data rows
  const records: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, ''))
    if (values.length === headers.length) {
      records.push({
        Product_Display_Name: values[productNameIdx] || '',
        String_Id: values[stringIdIdx] || '',
        GUID: values[headers.indexOf('GUID')] || '',
      })
    }
  }

  console.log(`Parsed ${records.length} rows from CSV`)

  // Create a map to store unique SKU mappings
  // Use Map to ensure we only keep one product name per SKU part number
  const skuMap = new Map<string, string>()

  for (const row of records) {
    const skuPartNumber = row.String_Id?.trim()
    const productName = row.Product_Display_Name?.trim()

    // Skip rows with missing data
    if (!skuPartNumber || !productName || skuPartNumber === '' || productName === '') {
      continue
    }

    // Normalize SKU part number (uppercase, remove tabs/spaces)
    const normalizedSku = skuPartNumber.toUpperCase().replace(/\s+/g, '').replace(/\t+/g, '')

    // Skip if normalization resulted in empty string
    if (normalizedSku === '') {
      continue
    }

    // Only add if we haven't seen this SKU before, or if the product name is more descriptive
    if (!skuMap.has(normalizedSku)) {
      skuMap.set(normalizedSku, productName)
    } else {
      // If we have a shorter name, replace with longer (more descriptive) one
      const existingName = skuMap.get(normalizedSku)!
      if (productName.length > existingName.length) {
        skuMap.set(normalizedSku, productName)
      }
    }
  }

  console.log(`Found ${skuMap.size} unique SKU part numbers`)

  // Convert map to array
  return Array.from(skuMap.entries()).map(([sku, product]) => ({
    sku_part_number: sku,
    product_name: product,
  }))
}

/**
 * Import SKU mappings into database
 */
async function importSkuMappings(mappings: SkuMapping[]): Promise<void> {
  console.log(`\nImporting ${mappings.length} SKU mappings into database...`)

  const batchSize = 100
  let imported = 0
  let errors = 0

  for (let i = 0; i < mappings.length; i += batchSize) {
    const batch = mappings.slice(i, i + batchSize)
    
    // Prepare batch for upsert
    const upsertData = batch.map((mapping) => ({
      sku_part_number: mapping.sku_part_number,
      product_name: mapping.product_name,
      source: 'microsoft_csv',
      is_active: true,
      notes: 'Imported from Microsoft official CSV',
    }))

    const { data, error } = await supabase
      .from('sku_product_mappings')
      .upsert(upsertData, {
        onConflict: 'sku_part_number',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error(`Error importing batch ${Math.floor(i / batchSize) + 1}:`, error)
      errors += batch.length
    } else {
      // Count successful imports
      imported += data?.length || 0
    }

    // Progress indicator
    if ((i + batchSize) % 500 === 0 || i + batchSize >= mappings.length) {
      console.log(`  Progress: ${Math.min(i + batchSize, mappings.length)}/${mappings.length}`)
    }
  }

  console.log(`\n✅ Import complete!`)
  console.log(`   - Total processed: ${imported}`)
  console.log(`   - Successful: ${imported}`)
  console.log(`   - Errors: ${errors}`)
}

/**
 * Main function
 */
async function main() {
  const csvFilePath = path.join(
    process.cwd(),
    'Product names and service plan identifiers for licensing.csv'
  )

  if (!fs.existsSync(csvFilePath)) {
    console.error(`Error: CSV file not found at ${csvFilePath}`)
    console.error('Please ensure the CSV file is in the project root directory')
    process.exit(1)
  }

  try {
    // Parse CSV
    const mappings = parseCsvFile(csvFilePath)

    if (mappings.length === 0) {
      console.error('Error: No mappings found in CSV file')
      process.exit(1)
    }

    // Show sample of what will be imported
    console.log('\nSample mappings (first 10):')
    mappings.slice(0, 10).forEach((m) => {
      console.log(`  ${m.sku_part_number} → ${m.product_name}`)
    })

    // Confirm before importing
    console.log(`\nReady to import ${mappings.length} unique SKU mappings.`)
    console.log('This will update existing mappings and add new ones.')
    
    // Import
    await importSkuMappings(mappings)

    console.log('\n✨ Done! SKU mappings have been imported into the database.')
    console.log('The cache will automatically refresh on the next lookup.')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

// Run the script
main()
