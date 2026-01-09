// Supabase Edge Function to sync Microsoft Graph API data to Supabase
// Deno runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface TokenResponse {
  access_token: string
  expires_in: number
}

interface SyncResult {
  success: boolean
  recordsSynced: number
  error?: string
}

/**
 * Get Microsoft Graph access token using client credentials flow
 */
async function getAccessToken(): Promise<string> {
  const tenantId = Deno.env.get('MICROSOFT_GRAPH_TENANT_ID')
  const clientId = Deno.env.get('MICROSOFT_GRAPH_CLIENT_ID')
  const clientSecret = Deno.env.get('MICROSOFT_GRAPH_CLIENT_SECRET')

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Missing Microsoft Graph API credentials')
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get access token: ${error}`)
  }

  const data: TokenResponse = await response.json()
  return data.access_token
}

/**
 * Fetch users from Microsoft Graph (with pagination support)
 */
async function fetchUsers(accessToken: string) {
  const allUsers: any[] = []
  let nextLink: string | null = 'https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,accountEnabled,createdDateTime,mobilePhone,businessPhones,city,state,country,postalCode,companyName,mailNickname,assignedLicenses'

  while (nextLink) {
    const response: Response = await fetch(nextLink, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`)
    }

    const data: any = await response.json()
    
    // Add users from this page
    if (data.value) {
      allUsers.push(...data.value)
    }

    // Check if there's a next page
    nextLink = data['@odata.nextLink'] || null
  }

  return allUsers
}

/**
 * Fetch subscribed SKUs (licenses) from Microsoft Graph
 */
async function fetchSubscribedSkus(accessToken: string) {
  const response = await fetch(
    'https://graph.microsoft.com/v1.0/subscribedSkus',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch subscribed SKUs: ${response.statusText}`)
  }

  const data = await response.json()
  return data.value || []
}

/**
 * Sync users to Supabase
 */
async function syncUsers(
  supabase: any,
  accessToken: string
): Promise<SyncResult> {
  try {
    const users = await fetchUsers(accessToken)
    let synced = 0

    for (const user of users) {
      const { error } = await supabase
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
            mobile_phone: user.mobilePhone,
            business_phones: user.businessPhones || [],
            city: user.city,
            state: user.state,
            country: user.country,
            postal_code: user.postalCode,
            company_name: user.companyName,
            created_date_time: user.createdDateTime,
            mail_nickname: user.mailNickname,
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
 * Get product name from SKU mapping table
 */
async function getProductNameFromMapping(
  supabase: any,
  skuPartNumber: string | null | undefined
): Promise<string | null> {
  if (!skuPartNumber) {
    return null
  }

  // Clean the SKU (remove invisible characters, normalize)
  const cleanSku = skuPartNumber.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()

  // Try exact match first
  const { data: exactMatch } = await supabase
    .from('sku_product_mappings')
    .select('product_name')
    .eq('sku_part_number', cleanSku)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (exactMatch?.product_name) {
    return exactMatch.product_name
  }

  // Try uppercase match
  const { data: upperMatch } = await supabase
    .from('sku_product_mappings')
    .select('product_name')
    .eq('sku_part_number', cleanSku.toUpperCase())
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (upperMatch?.product_name) {
    return upperMatch.product_name
  }

  return null
}

/**
 * Sync licenses to Supabase
 */
async function syncLicenses(
  supabase: any,
  accessToken: string
): Promise<SyncResult> {
  try {
    const skus = await fetchSubscribedSkus(accessToken)
    let synced = 0

    for (const sku of skus) {
      // Try to get product name from mapping table, fallback to Graph API name or SKU
      const productName = await getProductNameFromMapping(supabase, sku.skuPartNumber) ||
                          sku.capabilityStatus?.[0]?.name ||
                          sku.skuPartNumber

      const { error } = await supabase
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
            capability_status: sku.capabilityStatus || null,
            applies_to: sku.appliesTo || null,
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
 * Sync user license assignments to Supabase
 */
async function syncUserLicenses(
  supabase: any,
  accessToken: string
): Promise<SyncResult> {
  try {
    // Fetch users with their assigned licenses
    const users = await fetchUsers(accessToken)
    
    // Get all users from our database to map graph_user_id to user_id
    const { data: dbUsers } = await supabase
      .from('users')
      .select('id, graph_user_id')

    const userMap = new Map<string, string>()
    dbUsers?.forEach((u: any) => {
      if (u.graph_user_id) userMap.set(u.graph_user_id, u.id)
    })

    // Get all licenses from our database to map sku_id to license_id
    const { data: dbLicenses } = await supabase
      .from('licenses')
      .select('id, sku_id')

    const licenseMap = new Map<string, string>()
    dbLicenses?.forEach((l: any) => {
      if (l.sku_id) licenseMap.set(l.sku_id, l.id)
    })

    let synced = 0
    const syncTime = new Date().toISOString()

    // Process each user's assigned licenses
    for (const user of users) {
      const userId = userMap.get(user.id)
      if (!userId) {
        continue // Skip if user not found in our database
      }

      const assignedLicenses = user.assignedLicenses || []
      
      // Remove all existing license assignments for this user
      // We'll re-add them based on current data from Microsoft Graph
      await supabase
        .from('user_licenses')
        .delete()
        .eq('user_id', userId)

      // Add current license assignments
      for (const assignedLicense of assignedLicenses) {
        const skuId = assignedLicense.skuId
        const licenseId = licenseMap.get(skuId)

        if (!licenseId) {
          // License not found in our database, skip it
          console.warn(`License with SKU ID ${skuId} not found in database for user ${user.id}`)
          continue
        }

        const { error } = await supabase
          .from('user_licenses')
          .upsert(
            {
              user_id: userId,
              license_id: licenseId,
              sku_id: skuId,
              last_synced_at: syncTime,
            },
            {
              onConflict: 'user_id,sku_id',
            }
          )

        if (!error) {
          synced++
        } else {
          console.error(`Error syncing license assignment for user ${user.id}, license ${skuId}:`, error)
        }
      }
    }

    return { success: true, recordsSynced: synced }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error syncing user licenses:', errorMessage)
    return { success: false, recordsSynced: 0, error: errorMessage }
  }
}

/**
 * Parse CSV response from Microsoft Graph Reports API
 * Handles quoted values that may contain commas
 */
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  // Helper function to parse CSV line handling quoted values
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

  // Parse header row
  const headers = parseCSVLine(lines[0]).map((h: string) => h.replace(/^"|"$/g, ''))
  
  // Parse data rows
  const data: any[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map((v: string) => v.replace(/^"|"$/g, ''))
    if (values.length === headers.length) {
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      data.push(row)
    }
  }
  
  return data
}

/**
 * Sync mailbox usage to Supabase
 */
async function syncMailboxUsage(
  supabase: any,
  accessToken: string
): Promise<SyncResult> {
  try {
    // Fetch mailbox usage (this endpoint returns CSV, not JSON)
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/reports/getMailboxUsageDetail(period='D7')",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      // If reports endpoint is not available, return gracefully
      console.warn('Mailbox usage endpoint not available:', response.statusText)
      return { success: true, recordsSynced: 0 }
    }

    // Microsoft Graph Reports API returns CSV, not JSON
    const csvText = await response.text()
    const usageArray = parseCSV(csvText)

    if (usageArray.length === 0) {
      return { success: true, recordsSynced: 0 }
    }

    // Get all users to map graph_user_id to our user_id
    const { data: users } = await supabase
      .from('users')
      .select('id, graph_user_id, email, user_principal_name')

    const userMap = new Map<string, string>()
    users?.forEach((u: any) => {
      if (u.graph_user_id) userMap.set(u.graph_user_id, u.id)
      if (u.email) userMap.set(u.email.toLowerCase(), u.id)
      if (u.user_principal_name) userMap.set(u.user_principal_name.toLowerCase(), u.id)
    })

    let synced = 0
    const today = new Date().toISOString().split('T')[0]

    for (const usage of usageArray) {
      // CSV columns: Report Refresh Date, User Principal Name, Display Name, Is Deleted, Deleted Date, Created Date, Last Activity Date, Item Count, Storage Used (Byte), Issue Warning Quota (Byte), Prohibit Send Quota (Byte), Prohibit Send Receive Quota (Byte), Report Period
      const userPrincipalName = usage['User Principal Name']?.toLowerCase() || ''
      const userId = userMap.get(userPrincipalName)

      if (!userId) {
        continue
      }

      // Convert storage from string to number (bytes)
      const storageUsedBytes = parseInt(usage['Storage Used (Byte)'] || '0', 10)
      const itemCount = parseInt(usage['Item Count'] || '0', 10)
      const issueWarningQuotaBytes = parseInt(usage['Issue Warning Quota (Byte)'] || '0', 10)
      const prohibitSendQuotaBytes = parseInt(usage['Prohibit Send Quota (Byte)'] || '0', 10)
      const prohibitSendReceiveQuotaBytes = parseInt(usage['Prohibit Send Receive Quota (Byte)'] || '0', 10)

      // Parse dates
      const reportRefreshDate = usage['Report Refresh Date'] ? new Date(usage['Report Refresh Date']).toISOString().split('T')[0] : null
      const deletedDate = usage['Deleted Date'] ? new Date(usage['Deleted Date']).toISOString().split('T')[0] : null
      const createdDate = usage['Created Date'] ? new Date(usage['Created Date']).toISOString().split('T')[0] : null
      const lastActivityDate = usage['Last Activity Date'] ? new Date(usage['Last Activity Date']).toISOString().split('T')[0] : null
      const isDeleted = usage['Is Deleted']?.toLowerCase() === 'true'

      const { error } = await supabase
        .from('mailbox_usage')
        .upsert(
          {
            user_id: userId,
            graph_user_id: usage['User Principal Name'],
            display_name: usage['Display Name'],
            storage_used_bytes: storageUsedBytes,
            item_count: itemCount,
            report_period: usage['Report Period'] || 'D7',
            report_date: today,
            report_refresh_date: reportRefreshDate,
            is_deleted: isDeleted,
            deleted_date: deletedDate,
            created_date: createdDate,
            last_activity_date: lastActivityDate,
            issue_warning_quota_bytes: issueWarningQuotaBytes,
            prohibit_send_quota_bytes: prohibitSendQuotaBytes,
            prohibit_send_receive_quota_bytes: prohibitSendReceiveQuotaBytes,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,report_date',
          }
        )

      if (!error) {
        synced++
      } else {
        console.error(
          `Error syncing mailbox usage for ${usage['User Principal Name']}:`,
          error
        )
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
 * Sync OneDrive usage to Supabase
 */
async function syncOneDriveUsage(
  supabase: any,
  accessToken: string
): Promise<SyncResult> {
  try {
    // Fetch OneDrive usage (this endpoint returns CSV, not JSON)
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/reports/getOneDriveUsageAccountDetail(period='D7')",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      console.warn('OneDrive usage endpoint not available:', response.statusText)
      return { success: true, recordsSynced: 0 }
    }

    // Microsoft Graph Reports API returns CSV, not JSON
    const csvText = await response.text()
    const usageArray = parseCSV(csvText)

    if (usageArray.length === 0) {
      return { success: true, recordsSynced: 0 }
    }

    // Get all users to map graph_user_id to our user_id
    const { data: users } = await supabase
      .from('users')
      .select('id, graph_user_id, email, user_principal_name')

    const userMap = new Map<string, string>()
    users?.forEach((u: any) => {
      if (u.graph_user_id) userMap.set(u.graph_user_id, u.id)
      if (u.email) userMap.set(u.email.toLowerCase(), u.id)
      if (u.user_principal_name) userMap.set(u.user_principal_name.toLowerCase(), u.id)
    })

    let synced = 0
    const today = new Date().toISOString().split('T')[0]

    for (const usage of usageArray) {
      // CSV columns: Report Refresh Date, Site URL, Owner Display Name, Owner Principal Name, Is Deleted, Last Activity Date, File Count, Active File Count, Storage Used (Byte), Storage Allocated (Byte), Report Period
      const ownerPrincipalName = usage['Owner Principal Name']?.toLowerCase() || ''
      const userId = userMap.get(ownerPrincipalName)

      if (!userId) {
        continue
      }

      // Convert values from string to number
      const storageUsedBytes = parseInt(usage['Storage Used (Byte)'] || '0', 10)
      const storageAllocatedBytes = parseInt(usage['Storage Allocated (Byte)'] || '0', 10)
      const fileCount = parseInt(usage['File Count'] || '0', 10)
      const activeFileCount = parseInt(usage['Active File Count'] || '0', 10)

      // Parse dates
      const reportRefreshDate = usage['Report Refresh Date'] ? new Date(usage['Report Refresh Date']).toISOString().split('T')[0] : null
      const lastActivityDate = usage['Last Activity Date'] ? new Date(usage['Last Activity Date']).toISOString().split('T')[0] : null
      const isDeleted = usage['Is Deleted']?.toLowerCase() === 'true'

      const { error } = await supabase
        .from('onedrive_usage')
        .upsert(
          {
            user_id: userId,
            graph_user_id: usage['Owner Principal Name'],
            owner_display_name: usage['Owner Display Name'],
            site_url: usage['Site URL'],
            storage_used_bytes: storageUsedBytes,
            storage_allocated_bytes: storageAllocatedBytes,
            file_count: fileCount,
            active_file_count: activeFileCount,
            report_period: usage['Report Period'] || 'D7',
            report_date: today,
            report_refresh_date: reportRefreshDate,
            is_deleted: isDeleted,
            last_activity_date: lastActivityDate,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,report_date',
          }
        )

      if (!error) {
        synced++
      } else {
        console.error(`Error syncing OneDrive usage for ${usage['Owner Principal Name']}:`, error)
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
async function logSync(
  supabase: any,
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

  await supabase.from('sync_logs').insert({
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
 * Main Edge Function handler
 */
Deno.serve(async (req) => {
  try {
    // Get query parameters
    const url = new URL(req.url)
    const syncType = url.searchParams.get('type') || 'full'

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Microsoft Graph access token
    const accessToken = await getAccessToken()

    const results: Record<string, SyncResult> = {}
    const overallStart = new Date()

    // Sync users first (required for other syncs)
    if (syncType === 'full' || syncType === 'users') {
      const userStart = new Date()
      const userResult = await syncUsers(supabase, accessToken)
      const userEnd = new Date()
      results.users = userResult
      await logSync(
        supabase,
        'users',
        userResult.success ? 'success' : 'error',
        userResult.recordsSynced,
        userResult.error,
        userStart,
        userEnd
      )
    }

    // Sync licenses
    if (syncType === 'full' || syncType === 'licenses') {
      const licenseStart = new Date()
      const licenseResult = await syncLicenses(supabase, accessToken)
      const licenseEnd = new Date()
      results.licenses = licenseResult
      await logSync(
        supabase,
        'licenses',
        licenseResult.success ? 'success' : 'error',
        licenseResult.recordsSynced,
        licenseResult.error,
        licenseStart,
        licenseEnd
      )
    }

    // Sync user license assignments (requires users and licenses to be synced first)
    if (syncType === 'full' || syncType === 'user-licenses') {
      const userLicenseStart = new Date()
      const userLicenseResult = await syncUserLicenses(supabase, accessToken)
      const userLicenseEnd = new Date()
      results['user-licenses'] = userLicenseResult
      await logSync(
        supabase,
        'user-licenses',
        userLicenseResult.success ? 'success' : 'error',
        userLicenseResult.recordsSynced,
        userLicenseResult.error,
        userLicenseStart,
        userLicenseEnd
      )
    }

    // Sync mailbox usage
    if (syncType === 'full' || syncType === 'mailbox') {
      const mailboxStart = new Date()
      const mailboxResult = await syncMailboxUsage(supabase, accessToken)
      const mailboxEnd = new Date()
      results.mailbox = mailboxResult
      await logSync(
        supabase,
        'mailbox',
        mailboxResult.success ? 'success' : 'error',
        mailboxResult.recordsSynced,
        mailboxResult.error,
        mailboxStart,
        mailboxEnd
      )
    }

    // Sync OneDrive usage
    if (syncType === 'full' || syncType === 'onedrive') {
      const onedriveStart = new Date()
      const onedriveResult = await syncOneDriveUsage(supabase, accessToken)
      const onedriveEnd = new Date()
      results.onedrive = onedriveResult
      await logSync(
        supabase,
        'onedrive',
        onedriveResult.success ? 'success' : 'error',
        onedriveResult.recordsSynced,
        onedriveResult.error,
        onedriveStart,
        onedriveEnd
      )
    }

    const overallEnd = new Date()
    const overallSuccess = Object.values(results).every((r) => r.success)

    await logSync(
      supabase,
      syncType === 'full' ? 'full' : syncType,
      overallSuccess ? 'success' : 'partial',
      Object.values(results).reduce((sum, r) => sum + r.recordsSynced, 0),
      undefined,
      overallStart,
      overallEnd
    )

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        syncType,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

