/**
 * Script to update all existing licenses with proper product names from SKU mappings
 * 
 * Usage:
 *   npx tsx scripts/update-license-display-names.ts
 * 
 * This script:
 * 1. Fetches all licenses from the database
 * 2. Looks up proper product names from sku_product_mappings table
 * 3. Updates licenses that have missing or incorrect display_name
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
 * Normalize SKU part number for matching (remove spaces, tabs, normalize case)
 */
function normalizeSku(sku: string): string {
  return sku.toUpperCase().replace(/\s+/g, '').replace(/\t+/g, '').trim()
}

/**
 * Get product name from SKU mapping table
 * Tries multiple normalization strategies to find a match
 */
async function getProductNameFromMapping(skuPartNumber: string | null | undefined): Promise<string | null> {
  if (!skuPartNumber) {
    return null
  }

  // Try exact match first
  let { data, error } = await supabase
    .from('sku_product_mappings')
    .select('product_name')
    .eq('sku_part_number', skuPartNumber.toUpperCase())
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!error && data) {
    return data.product_name
  }

  // Try normalized match (remove spaces/tabs)
  const normalizedSku = normalizeSku(skuPartNumber)
  const { data: normalizedData, error: normalizedError } = await supabase
    .from('sku_product_mappings')
    .select('sku_part_number, product_name')
    .eq('is_active', true)

  if (!normalizedError && normalizedData) {
    // Find match by normalizing both sides
    for (const mapping of normalizedData) {
      if (normalizeSku(mapping.sku_part_number) === normalizedSku) {
        return mapping.product_name
      }
    }
  }

  return null
}

/**
 * Update all licenses with proper product names
 */
async function updateLicenseDisplayNames(): Promise<void> {
  console.log('Fetching all licenses from database...')

  // Get all licenses
  const { data: licenses, error: fetchError } = await supabase
    .from('licenses')
    .select('id, sku_part_number, display_name')
    .order('sku_part_number', { ascending: true })

  if (fetchError) {
    console.error('Error fetching licenses:', fetchError)
    process.exit(1)
  }

  if (!licenses || licenses.length === 0) {
    console.log('No licenses found in database.')
    return
  }

  console.log(`Found ${licenses.length} licenses to check\n`)

  let updated = 0
  let skipped = 0
  let notFound = 0
  const updates: Array<{ id: string; sku: string; oldName: string; newName: string }> = []

  // First, add any missing mappings for known SKUs
  const missingMappings = [
    { sku: 'CPC_E_8C_32GB_512GB', name: 'Windows 365 Enterprise 8 vCPU 32 GB 512 GB' },
    { sku: 'MICROSOFT_TEAMS_ENTERPRISE_NEW', name: 'Microsoft Teams Enterprise' },
    { sku: 'MICROSOFTCOPILOT_FOR_FINANCE', name: 'Microsoft Copilot for Finance' },
  ]

  for (const mapping of missingMappings) {
    await supabase
      .from('sku_product_mappings')
      .upsert({
        sku_part_number: mapping.sku,
        product_name: mapping.name,
        source: 'manual',
        is_active: true,
        notes: 'Added automatically by update script',
      }, {
        onConflict: 'sku_part_number',
      })
  }

  // Process each license
  for (const license of licenses) {
    if (!license.sku_part_number) {
      skipped++
      continue
    }

    // Clean the SKU (remove invisible characters, normalize)
    const cleanSku = license.sku_part_number.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()

    // Get product name from mapping table
    const productName = await getProductNameFromMapping(cleanSku)

    if (!productName) {
      notFound++
      console.log(`⚠️  No mapping found for: ${license.sku_part_number}`)
      continue
    }

    // Check if update is needed
    const currentName = license.display_name || ''
    const needsUpdate = !currentName || currentName !== productName

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('licenses')
        .update({ display_name: productName })
        .eq('id', license.id)

      if (updateError) {
        console.error(`Error updating license ${license.id}:`, updateError)
      } else {
        updated++
        updates.push({
          id: license.id,
          sku: license.sku_part_number,
          oldName: currentName || '(empty)',
          newName: productName,
        })
      }
    } else {
      skipped++
    }
  }

  // Show results
  console.log('\n' + '='.repeat(80))
  console.log('📊 Update Summary')
  console.log('='.repeat(80))
  console.log(`✅ Updated: ${updated}`)
  console.log(`⏭️  Skipped (already correct): ${skipped}`)
  console.log(`❌ No mapping found: ${notFound}`)
  console.log(`📝 Total licenses: ${licenses.length}`)

  if (updates.length > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('📋 Updated Licenses (showing first 20):')
    console.log('='.repeat(80))
    updates.slice(0, 20).forEach((update) => {
      console.log(`\nSKU: ${update.sku}`)
      console.log(`  Old: ${update.oldName}`)
      console.log(`  New: ${update.newName}`)
    })

    if (updates.length > 20) {
      console.log(`\n... and ${updates.length - 20} more updates`)
    }
  }

  if (notFound > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('⚠️  Note: Some SKUs were not found in the mapping table.')
    console.log('   These licenses will use fallback names or SKU part numbers.')
    console.log('='.repeat(80))
  }

  console.log('\n✨ Done! All licenses have been updated with proper product names.')
  console.log('   The changes will be visible immediately in your application.')
}

/**
 * Main function
 */
async function main() {
  try {
    await updateLicenseDisplayNames()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

// Run the script
main()
