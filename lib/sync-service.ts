import { supabaseAdmin } from './supabase'
import {
  fetchUsers,
  fetchSubscribedSkus,
  fetchMailboxUsage,
  fetchOneDriveUsage,
} from './microsoft-graph'
import { getProductNameFromSku } from './sku-product-mapping'

interface SyncResult {
  success: boolean
  recordsSynced: number
  error?: string
}

/**
 * Sync users from Microsoft Graph to Supabase
 */
export async function syncUsers(): Promise<SyncResult> {
  try {
    const users = await fetchUsers()
    let synced = 0

    for (const user of users) {
      const { error } = await supabaseAdmin
        .from('users')
        .upsert(
          {
            graph_user_id: user.id,
            display_name: user.displayName,
            email: user.mail || user.userPrincipalName,
            user_principal_name: user.userPrincipalName,
            job_title: user.jobTitle,
            department: user.department,
            office_location: user.officeLocation,
            account_enabled: user.accountEnabled,
            last_synced_at: new Date().toISOString(),
          },
          {
            onConflict: 'graph_user_id',
          }
        )

      if (!error) {
        synced++
      } else {
        console.error(`Error syncing user ${user.id}:`, error)
      }
    }

    return { success: true, recordsSynced: synced }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error syncing users:', errorMessage)
    return { success: false, recordsSynced: 0, error: errorMessage }
  }
}

/**
 * Sync licenses from Microsoft Graph to Supabase
 */
export async function syncLicenses(): Promise<SyncResult> {
  try {
    const skus = await fetchSubscribedSkus()
    let synced = 0

    for (const sku of skus) {
      // Use Microsoft Graph name if available, otherwise use our SKU mapping
      const graphDisplayName = sku.capabilityStatus?.[0]?.name
      const productName = graphDisplayName || await getProductNameFromSku(sku.skuPartNumber)
      
      const { error } = await supabaseAdmin
        .from('licenses')
        .upsert(
          {
            sku_id: sku.skuId,
            sku_part_number: sku.skuPartNumber,
            display_name: productName,
            total_units: sku.prepaidUnits?.enabled || 0,
            consumed_units: sku.consumedUnits || 0,
            available_units:
              (sku.prepaidUnits?.enabled || 0) - (sku.consumedUnits || 0),
            last_synced_at: new Date().toISOString(),
          },
          {
            onConflict: 'sku_id',
          }
        )

      if (!error) {
        synced++
      } else {
        console.error(`Error syncing license ${sku.skuId}:`, error)
      }
    }

    return { success: true, recordsSynced: synced }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error syncing licenses:', errorMessage)
    return { success: false, recordsSynced: 0, error: errorMessage }
  }
}

/**
 * Sync mailbox usage from Microsoft Graph to Supabase
 */
export async function syncMailboxUsage(): Promise<SyncResult> {
  try {
    const usageData = await fetchMailboxUsage()
    
    // If the API returns empty or error, return early
    if (!usageData || usageData.length === 0) {
      return { success: true, recordsSynced: 0 }
    }

    let synced = 0
    const today = new Date().toISOString().split('T')[0]

    // First, get all users to map graph_user_id to our user_id
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, graph_user_id')

    const userMap = new Map(
      users?.map((u) => [u.graph_user_id, u.id]) || []
    )

    for (const usage of usageData) {
      const userId = userMap.get(usage.userId || usage.userPrincipalName)
      
      if (!userId) {
        // Try to find user by email or create a reference
        continue
      }

      const { error } = await supabaseAdmin
        .from('mailbox_usage')
        .upsert(
          {
            user_id: userId,
            graph_user_id: usage.userId || usage.userPrincipalName,
            storage_used_bytes: usage.storageUsedInBytes || 0,
            item_count: usage.itemCount || 0,
            report_period: usage.reportPeriod || 'D7',
            report_date: today,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,report_date',
          }
        )

      if (!error) {
        synced++
      } else {
        console.error(`Error syncing mailbox usage for ${usage.userId}:`, error)
      }
    }

    return { success: true, recordsSynced: synced }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error syncing mailbox usage:', errorMessage)
    return { success: false, recordsSynced: 0, error: errorMessage }
  }
}

/**
 * Sync OneDrive usage from Microsoft Graph to Supabase
 */
export async function syncOneDriveUsage(): Promise<SyncResult> {
  try {
    const usageData = await fetchOneDriveUsage()
    
    // If the API returns empty or error, return early
    if (!usageData || usageData.length === 0) {
      return { success: true, recordsSynced: 0 }
    }

    let synced = 0
    const today = new Date().toISOString().split('T')[0]

    // First, get all users to map graph_user_id to our user_id
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, graph_user_id')

    const userMap = new Map(
      users?.map((u) => [u.graph_user_id, u.id]) || []
    )

    for (const usage of usageData) {
      const userId = userMap.get(usage.ownerId || usage.ownerPrincipalName)
      
      if (!userId) {
        continue
      }

      const { error } = await supabaseAdmin
        .from('onedrive_usage')
        .upsert(
          {
            user_id: userId,
            graph_user_id: usage.ownerId || usage.ownerPrincipalName,
            storage_used_bytes: usage.storageUsedInBytes || 0,
            storage_allocated_bytes: usage.storageAllocatedInBytes || 0,
            file_count: usage.fileCount || 0,
            active_file_count: usage.activeFileCount || 0,
            report_period: usage.reportPeriod || 'D7',
            report_date: today,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,report_date',
          }
        )

      if (!error) {
        synced++
      } else {
        console.error(`Error syncing OneDrive usage for ${usage.ownerId}:`, error)
      }
    }

    return { success: true, recordsSynced: synced }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error syncing OneDrive usage:', errorMessage)
    return { success: false, recordsSynced: 0, error: errorMessage }
  }
}

/**
 * Log sync operation to database
 */
export async function logSync(
  syncType: string,
  status: 'success' | 'error' | 'partial',
  recordsSynced: number,
  errorMessage?: string,
  startedAt?: Date,
  completedAt?: Date
) {
  const duration = startedAt && completedAt
    ? completedAt.getTime() - startedAt.getTime()
    : null

  await supabaseAdmin.from('sync_logs').insert({
    sync_type: syncType,
    status,
    records_synced: recordsSynced,
    error_message: errorMessage,
    started_at: startedAt?.toISOString(),
    completed_at: completedAt?.toISOString(),
    duration_ms: duration,
  })
}

/**
 * Full sync - syncs all data types
 */
export async function fullSync(): Promise<{
  success: boolean
  results: Record<string, SyncResult>
}> {
  const results: Record<string, SyncResult> = {}
  const overallStart = new Date()

  // Sync users first (required for other syncs)
  const userStart = new Date()
  const userResult = await syncUsers()
  const userEnd = new Date()
  results.users = userResult
  await logSync(
    'users',
    userResult.success ? 'success' : 'error',
    userResult.recordsSynced,
    userResult.error,
    userStart,
    userEnd
  )

  // Sync licenses
  const licenseStart = new Date()
  const licenseResult = await syncLicenses()
  const licenseEnd = new Date()
  results.licenses = licenseResult
  await logSync(
    'licenses',
    licenseResult.success ? 'success' : 'error',
    licenseResult.recordsSynced,
    licenseResult.error,
    licenseStart,
    licenseEnd
  )

  // Sync mailbox usage
  const mailboxStart = new Date()
  const mailboxResult = await syncMailboxUsage()
  const mailboxEnd = new Date()
  results.mailbox = mailboxResult
  await logSync(
    'mailbox',
    mailboxResult.success ? 'success' : 'error',
    mailboxResult.recordsSynced,
    mailboxResult.error,
    mailboxStart,
    mailboxEnd
  )

  // Sync OneDrive usage
  const onedriveStart = new Date()
  const onedriveResult = await syncOneDriveUsage()
  const onedriveEnd = new Date()
  results.onedrive = onedriveResult
  await logSync(
    'onedrive',
    onedriveResult.success ? 'success' : 'error',
    onedriveResult.recordsSynced,
    onedriveResult.error,
    onedriveStart,
    onedriveEnd
  )

  const overallEnd = new Date()
  const overallSuccess = Object.values(results).every((r) => r.success)

  await logSync(
    'full',
    overallSuccess ? 'success' : 'partial',
    Object.values(results).reduce((sum, r) => sum + r.recordsSynced, 0),
    undefined,
    overallStart,
    overallEnd
  )

  return {
    success: overallSuccess,
    results,
  }
}

