/**
 * Manual sync script
 * Run with: npx tsx scripts/sync-manual.ts
 * 
 * Make sure to set all environment variables in .env.local first
 */

import { fullSync } from '../lib/sync-service'

async function main() {
  console.log('Starting manual sync...')
  console.log('Timestamp:', new Date().toISOString())
  console.log('---')

  try {
    const result = await fullSync()

    console.log('Sync completed!')
    console.log('Overall success:', result.success)
    console.log('---')
    console.log('Results:')
    
    for (const [type, syncResult] of Object.entries(result.results)) {
      console.log(`  ${type}:`)
      console.log(`    Success: ${syncResult.success}`)
      console.log(`    Records synced: ${syncResult.recordsSynced}`)
      if (syncResult.error) {
        console.log(`    Error: ${syncResult.error}`)
      }
    }

    process.exit(result.success ? 0 : 1)
  } catch (error) {
    console.error('Fatal error during sync:', error)
    process.exit(1)
  }
}

main()

