import { supabaseAdmin } from './supabase'
import { getProductNameFromSku } from './sku-product-mapping'

// Helper function to format bytes to human readable format
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

// Helper function to format bytes to TB for large numbers
export function formatBytesToTB(bytes: number): string {
  const tb = bytes / (1024 * 1024 * 1024 * 1024)
  return `${tb.toFixed(1)} TB`
}

// Get dashboard overview statistics
export async function getDashboardStats() {
  try {
    // Get total users
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('account_enabled', true)

    // Get active licenses count
    const { data: licenses } = await supabaseAdmin
      .from('licenses')
      .select('consumed_units')

    const activeLicenses = licenses?.reduce((sum, lic) => sum + (lic.consumed_units || 0), 0) || 0

    // Get total mailbox usage - get latest usage per user
    const { data: allMailboxData } = await supabaseAdmin
      .from('mailbox_usage')
      .select('user_id, storage_used_bytes, report_date')
      .order('report_date', { ascending: false })

    // Get the latest usage per user
    const latestMailboxUsage = new Map<string, number>()
    allMailboxData?.forEach((mb) => {
      if (mb.user_id && mb.storage_used_bytes) {
        const existing = latestMailboxUsage.get(mb.user_id)
        if (!existing || (mb.storage_used_bytes > existing)) {
          latestMailboxUsage.set(mb.user_id, mb.storage_used_bytes)
        }
      }
    })
    const totalMailboxBytes = Array.from(latestMailboxUsage.values()).reduce((sum, bytes) => sum + bytes, 0)

    // Get total OneDrive usage - get latest usage per user
    const { data: allOneDriveData } = await supabaseAdmin
      .from('onedrive_usage')
      .select('user_id, storage_used_bytes, report_date')
      .order('report_date', { ascending: false })

    // Get the latest usage per user
    const latestOneDriveUsage = new Map<string, number>()
    allOneDriveData?.forEach((od) => {
      if (od.user_id && od.storage_used_bytes) {
        const existing = latestOneDriveUsage.get(od.user_id)
        if (!existing || (od.storage_used_bytes > existing)) {
          latestOneDriveUsage.set(od.user_id, od.storage_used_bytes)
        }
      }
    })
    const totalOneDriveBytes = Array.from(latestOneDriveUsage.values()).reduce((sum, bytes) => sum + bytes, 0)

    return {
      totalUsers: totalUsers || 0,
      activeLicenses,
      totalMailboxBytes,
      totalOneDriveBytes,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalUsers: 0,
      activeLicenses: 0,
      totalMailboxBytes: 0,
      totalOneDriveBytes: 0,
    }
  }
}

// Get users with their usage data
export async function getUsersWithUsage() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('display_name', { ascending: true })
      .limit(100)

    if (error) throw error

    // Get latest mailbox usage for each user
    const { data: mailboxUsage } = await supabaseAdmin
      .from('mailbox_usage')
      .select('user_id, storage_used_bytes, report_date')
      .order('report_date', { ascending: false })

    // Get latest OneDrive usage for each user
    const { data: onedriveUsage } = await supabaseAdmin
      .from('onedrive_usage')
      .select('user_id, storage_used_bytes, report_date')
      .order('report_date', { ascending: false })

    // Get user licenses with license details
    const { data: userLicenses } = await supabaseAdmin
      .from('user_licenses')
      .select(`
        user_id,
        license_id,
        sku_id
      `)

    // Get all licenses to map SKU to product names
    const { data: allLicenses } = await supabaseAdmin
      .from('licenses')
      .select('id, display_name, sku_part_number')

    // Create a map of license_id to product name (with fallback to SKU mapping)
    const licenseNameMap = new Map<string, string>()
    if (allLicenses) {
      await Promise.all(
        allLicenses.map(async (license) => {
          let licenseName = license.display_name
          if (!licenseName && license.sku_part_number) {
            licenseName = await getProductNameFromSku(license.sku_part_number)
          }
          if (!licenseName) {
            licenseName = license.sku_part_number || 'Unknown License'
          }
          licenseNameMap.set(license.id, licenseName)
        })
      )
    }

    // Create a map of user_id to licenses
    const userLicenseMap = new Map<string, string[]>()
    userLicenses?.forEach((ul: any) => {
      if (ul.user_id && ul.license_id) {
        const licenseName = licenseNameMap.get(ul.license_id) || 'Unknown License'
        if (!userLicenseMap.has(ul.user_id)) {
          userLicenseMap.set(ul.user_id, [])
        }
        userLicenseMap.get(ul.user_id)!.push(licenseName)
      }
    })

    // Combine data
    const usersWithUsage = users?.map((user) => {
      const latestMailbox = mailboxUsage?.find((mb) => mb.user_id === user.id)
      const latestOneDrive = onedriveUsage?.find((od) => od.user_id === user.id)
      const userLicensesList = userLicenseMap.get(user.id) || []

      return {
        id: user.id,
        name: user.display_name || user.email || 'Unknown',
        email: user.email || user.user_principal_name || '',
        role: user.job_title || 'User',
        licenses: userLicensesList,
        status: user.account_enabled ? 'active' : 'inactive',
        mailbox: latestMailbox?.storage_used_bytes ? formatBytes(latestMailbox.storage_used_bytes) : '0 B',
        onedrive: latestOneDrive?.storage_used_bytes ? formatBytes(latestOneDrive.storage_used_bytes) : '0 B',
        lastActive: user.last_synced_at ? formatLastActive(user.last_synced_at) : 'Never',
      }
    }) || []

    return usersWithUsage
  } catch (error) {
    console.error('Error fetching users with usage:', error)
    return []
  }
}

// Get license summary (total and used) for sidebar
export async function getLicenseSummary() {
  try {
    const { data: licenses, error } = await supabaseAdmin
      .from('licenses')
      .select('total_units, consumed_units')

    if (error) throw error

    const total = licenses?.reduce((sum, lic) => sum + (lic.total_units || 0), 0) || 0
    const used = licenses?.reduce((sum, lic) => sum + (lic.consumed_units || 0), 0) || 0

    return {
      total,
      used,
    }
  } catch (error) {
    console.error('Error fetching license summary:', error)
    return {
      total: 0,
      used: 0,
    }
  }
}

// Get license overview data
export async function getLicenseOverview() {
  try {
    const { data: licenses, error } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .order('display_name', { ascending: true })

    if (error) throw error

    // Get actual user counts for each license from user_licenses table
    const { data: userLicenseCounts } = await supabaseAdmin
      .from('user_licenses')
      .select('license_id')
    
    // Count users per license
    const actualUserCountMap = new Map<string, number>()
    userLicenseCounts?.forEach((ul: any) => {
      if (ul.license_id) {
        actualUserCountMap.set(ul.license_id, (actualUserCountMap.get(ul.license_id) || 0) + 1)
      }
    })

    // Get product names for all licenses (batch lookup)
    const licenseNames = await Promise.all(
      licenses?.map(async (license) => {
        const actualUserCount = actualUserCountMap.get(license.id) || 0
        return {
          id: license.id,
          name: license.display_name || await getProductNameFromSku(license.sku_part_number),
          total: license.total_units || 0,
          used: license.consumed_units || 0, // Microsoft Graph count
          actualUsers: actualUserCount, // Actual count from user_licenses table
          available: license.available_units || 0,
        }
      }) || []
    )
    
    return licenseNames
  } catch (error) {
    console.error('Error fetching license overview:', error)
    return []
  }
}

// Get users assigned to a specific license
export async function getUsersByLicense(licenseId: string) {
  try {
    // Get user_licenses for this license
    const { data: userLicenses, error: ulError } = await supabaseAdmin
      .from('user_licenses')
      .select('user_id')
      .eq('license_id', licenseId)

    if (ulError) throw ulError

    if (!userLicenses || userLicenses.length === 0) {
      return []
    }

    // Get user IDs
    const userIds = userLicenses.map((ul: any) => ul.user_id).filter(Boolean)

    if (userIds.length === 0) {
      return []
    }

    // Get user details
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, display_name, email, user_principal_name, job_title, department, account_enabled')
      .in('id', userIds)
      .order('display_name', { ascending: true })

    if (usersError) throw usersError

    const formattedUsers = users?.map((user) => ({
      id: user.id,
      name: user.display_name || user.email || 'Unknown',
      email: user.email || user.user_principal_name || '',
      role: user.job_title || 'User',
      department: user.department || '',
      status: user.account_enabled ? 'active' : 'inactive',
    })) || []

    return formattedUsers
  } catch (error) {
    console.error('Error fetching users by license:', error)
    return []
  }
}

// Get mailbox usage data for charts
export async function getMailboxUsageData() {
  try {
    // Get usage over time (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: usageOverTime } = await supabaseAdmin
      .from('mailbox_usage')
      .select('report_date, storage_used_bytes, user_id')
      .gte('report_date', sixMonthsAgo.toISOString().split('T')[0])
      .order('report_date', { ascending: true })

    // Group by month - get latest usage per user per month
    const monthlyData = new Map<string, Map<string, number>>() // month -> user_id -> bytes
    usageOverTime?.forEach((usage) => {
      if (!usage.report_date || !usage.storage_used_bytes) return
      const date = new Date(usage.report_date)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, new Map())
      }
      const monthUsers = monthlyData.get(monthKey)!
      // For each month, keep the max usage per user
      const userId = usage.user_id || 'unknown'
      const existing = monthUsers.get(userId) || 0
      if (usage.storage_used_bytes > existing) {
        monthUsers.set(userId, usage.storage_used_bytes)
      }
    })

    // Sum up total usage per month
    const chartData = Array.from(monthlyData.entries())
      .map(([month, userMap]) => {
        const totalBytes = Array.from(userMap.values()).reduce((sum, bytes) => sum + bytes, 0)
        return {
          month: month.split(' ')[0], // Just the month name
          usage: totalBytes / (1024 * 1024 * 1024 * 1024), // Convert to TB
        }
      })
      .slice(-6) // Last 6 months

    // Get top mailboxes
    const { data: topMailboxes } = await supabaseAdmin
      .from('mailbox_usage')
      .select('storage_used_bytes, display_name, user_id')
      .order('storage_used_bytes', { ascending: false })
      .limit(10)

    // Get user names for top mailboxes
    const userIds = [...new Set(topMailboxes?.map((mb) => mb.user_id).filter(Boolean) || [])]
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, display_name')
      .in('id', userIds)

    const userMap = new Map(users?.map((u) => [u.id, u.display_name || 'Unknown']) || [])

    const topMailboxesList = topMailboxes?.slice(0, 4).map((mb) => {
      const userName = userMap.get(mb.user_id) || mb.display_name || 'Unknown'
      const totalBytes = topMailboxes?.[0]?.storage_used_bytes || 1
      return {
        user: userName,
        size: formatBytes(mb.storage_used_bytes || 0),
        percent: (mb.storage_used_bytes || 0) / totalBytes,
      }
    }) || []

    // Calculate total usage - get latest usage per user
    const { data: allUsage } = await supabaseAdmin
      .from('mailbox_usage')
      .select('user_id, storage_used_bytes, report_date')
      .order('report_date', { ascending: false })

    const latestUsage = new Map<string, number>()
    allUsage?.forEach((usage) => {
      if (usage.user_id && usage.storage_used_bytes) {
        const existing = latestUsage.get(usage.user_id)
        if (!existing || (usage.storage_used_bytes > existing)) {
          latestUsage.set(usage.user_id, usage.storage_used_bytes)
        }
      }
    })
    const totalUsage = Array.from(latestUsage.values()).reduce((sum, bytes) => sum + bytes, 0)

    return {
      chartData,
      topMailboxes: topMailboxesList,
      totalUsage,
    }
  } catch (error) {
    console.error('Error fetching mailbox usage data:', error)
    return {
      chartData: [],
      topMailboxes: [],
      totalUsage: 0,
    }
  }
}

// Get OneDrive usage data for charts
export async function getOneDriveUsageData() {
  try {
    // Get usage over time (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: usageOverTime } = await supabaseAdmin
      .from('onedrive_usage')
      .select('report_date, storage_used_bytes, user_id')
      .gte('report_date', sixMonthsAgo.toISOString().split('T')[0])
      .order('report_date', { ascending: true })

    // Group by month - get latest usage per user per month
    const monthlyData = new Map<string, Map<string, number>>() // month -> user_id -> bytes
    usageOverTime?.forEach((usage) => {
      if (!usage.report_date || !usage.storage_used_bytes) return
      const date = new Date(usage.report_date)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, new Map())
      }
      const monthUsers = monthlyData.get(monthKey)!
      // For each month, keep the max usage per user
      const userId = usage.user_id || 'unknown'
      const existing = monthUsers.get(userId) || 0
      if (usage.storage_used_bytes > existing) {
        monthUsers.set(userId, usage.storage_used_bytes)
      }
    })

    // Sum up total usage per month
    const chartData = Array.from(monthlyData.entries())
      .map(([month, userMap]) => {
        const totalBytes = Array.from(userMap.values()).reduce((sum, bytes) => sum + bytes, 0)
        return {
          month: month.split(' ')[0], // Just the month name
          usage: totalBytes / (1024 * 1024 * 1024 * 1024), // Convert to TB
        }
      })
      .slice(-6) // Last 6 months

    // Get top OneDrive accounts
    const { data: topOneDrives } = await supabaseAdmin
      .from('onedrive_usage')
      .select('storage_used_bytes, owner_display_name, user_id')
      .order('storage_used_bytes', { ascending: false })
      .limit(10)

    // Get user names for top OneDrives
    const userIds = [...new Set(topOneDrives?.map((od) => od.user_id).filter(Boolean) || [])]
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, display_name')
      .in('id', userIds)

    const userMap = new Map(users?.map((u) => [u.id, u.display_name || 'Unknown']) || [])

    const topOneDrivesList = topOneDrives?.slice(0, 4).map((od) => {
      const userName = userMap.get(od.user_id) || od.owner_display_name || 'Unknown'
      const totalBytes = topOneDrives?.[0]?.storage_used_bytes || 1
      return {
        user: userName,
        size: formatBytes(od.storage_used_bytes || 0),
        percent: (od.storage_used_bytes || 0) / totalBytes,
      }
    }) || []

    // Calculate total usage - get latest usage per user
    const { data: allUsage } = await supabaseAdmin
      .from('onedrive_usage')
      .select('user_id, storage_used_bytes, report_date')
      .order('report_date', { ascending: false })

    const latestUsage = new Map<string, number>()
    allUsage?.forEach((usage) => {
      if (usage.user_id && usage.storage_used_bytes) {
        const existing = latestUsage.get(usage.user_id)
        if (!existing || (usage.storage_used_bytes > existing)) {
          latestUsage.set(usage.user_id, usage.storage_used_bytes)
        }
      }
    })
    const totalUsage = Array.from(latestUsage.values()).reduce((sum, bytes) => sum + bytes, 0)

    return {
      chartData,
      topOneDrives: topOneDrivesList,
      totalUsage,
    }
  } catch (error) {
    console.error('Error fetching OneDrive usage data:', error)
    return {
      chartData: [],
      topOneDrives: [],
      totalUsage: 0,
    }
  }
}

// Get mailboxes with their usage data
export async function getMailboxesWithUsage() {
  try {
    // Get all mailbox usage records, ordered by report_date descending to get latest first
    const { data: mailboxUsage, error: usageError } = await supabaseAdmin
      .from('mailbox_usage')
      .select('*')
      .order('report_date', { ascending: false })

    if (usageError) throw usageError

    // Get all users to map user_id to user details
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, display_name, email, user_principal_name')

    if (usersError) throw usersError

    const userMap = new Map(
      users?.map((u) => [u.id, { name: u.display_name || u.email || 'Unknown', email: u.email || u.user_principal_name || '' }]) || []
    )

    // Get latest usage per user
    const latestUsageMap = new Map<string, typeof mailboxUsage[0]>()
    mailboxUsage?.forEach((mb) => {
      if (mb.user_id) {
        const existing = latestUsageMap.get(mb.user_id)
        if (!existing) {
          latestUsageMap.set(mb.user_id, mb)
        } else if (mb.report_date && existing.report_date) {
          // Compare dates if both exist
          const mbDate = new Date(mb.report_date)
          const existingDate = new Date(existing.report_date)
          if (mbDate > existingDate) {
            latestUsageMap.set(mb.user_id, mb)
          }
        } else if (mb.report_date && !existing.report_date) {
          // Prefer records with report_date
          latestUsageMap.set(mb.user_id, mb)
        }
      }
    })

    // Combine data
    const mailboxesWithUsage = Array.from(latestUsageMap.values()).map((mb) => {
      const user = userMap.get(mb.user_id) || { name: mb.display_name || 'Unknown', email: '' }
      const storageUsed = mb.storage_used_bytes || 0
      const quota = mb.prohibit_send_receive_quota_bytes || mb.prohibit_send_quota_bytes || 0
      const usagePercent = quota > 0 ? (storageUsed / quota) * 100 : 0

      return {
        id: mb.id,
        userId: mb.user_id,
        userName: user.name,
        userEmail: user.email,
        storageUsed: formatBytes(storageUsed),
        storageUsedBytes: storageUsed,
        itemCount: mb.item_count || 0,
        quota: quota > 0 ? formatBytes(quota) : 'Unlimited',
        quotaBytes: quota,
        usagePercent: Math.min(usagePercent, 100),
        lastActivity: mb.last_activity_date ? formatLastActive(mb.last_activity_date) : 'Never',
        lastActivityDate: mb.last_activity_date,
        reportDate: mb.report_date,
        isDeleted: mb.is_deleted || false,
        warningQuota: mb.issue_warning_quota_bytes ? formatBytes(mb.issue_warning_quota_bytes) : null,
      }
    })

    // Sort by storage used (descending)
    mailboxesWithUsage.sort((a, b) => b.storageUsedBytes - a.storageUsedBytes)

    return mailboxesWithUsage
  } catch (error) {
    console.error('Error fetching mailboxes with usage:', error)
    return []
  }
}

// Get OneDrives with their usage data
export async function getOneDrivesWithUsage() {
  try {
    // Get all OneDrive usage records, ordered by report_date descending to get latest first
    const { data: onedriveUsage, error: usageError } = await supabaseAdmin
      .from('onedrive_usage')
      .select('*')
      .order('report_date', { ascending: false })

    if (usageError) throw usageError

    // Get all users to map user_id to user details
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, display_name, email, user_principal_name')

    if (usersError) throw usersError

    const userMap = new Map(
      users?.map((u) => [u.id, { name: u.display_name || u.email || 'Unknown', email: u.email || u.user_principal_name || '' }]) || []
    )

    // Get latest usage per user
    const latestUsageMap = new Map<string, typeof onedriveUsage[0]>()
    onedriveUsage?.forEach((od) => {
      if (od.user_id) {
        const existing = latestUsageMap.get(od.user_id)
        if (!existing) {
          latestUsageMap.set(od.user_id, od)
        } else if (od.report_date && existing.report_date) {
          // Compare dates if both exist
          const odDate = new Date(od.report_date)
          const existingDate = new Date(existing.report_date)
          if (odDate > existingDate) {
            latestUsageMap.set(od.user_id, od)
          }
        } else if (od.report_date && !existing.report_date) {
          // Prefer records with report_date
          latestUsageMap.set(od.user_id, od)
        }
      }
    })

    // Combine data
    const onedrivesWithUsage = Array.from(latestUsageMap.values()).map((od) => {
      const user = userMap.get(od.user_id) || { name: od.owner_display_name || 'Unknown', email: '' }
      const storageUsed = od.storage_used_bytes || 0
      const quota = od.storage_allocated_bytes || 0
      const usagePercent = quota > 0 ? (storageUsed / quota) * 100 : 0

      return {
        id: od.id,
        userId: od.user_id,
        userName: user.name,
        userEmail: user.email,
        storageUsed: formatBytes(storageUsed),
        storageUsedBytes: storageUsed,
        fileCount: od.file_count || 0,
        activeFileCount: od.active_file_count || 0,
        quota: quota > 0 ? formatBytes(quota) : 'Unlimited',
        quotaBytes: quota,
        usagePercent: Math.min(usagePercent, 100),
        lastActivity: od.last_activity_date ? formatLastActive(od.last_activity_date) : 'Never',
        lastActivityDate: od.last_activity_date,
        reportDate: od.report_date,
        isDeleted: od.is_deleted || false,
        siteUrl: od.site_url || null,
      }
    })

    // Sort by storage used (descending)
    onedrivesWithUsage.sort((a, b) => b.storageUsedBytes - a.storageUsedBytes)

    return onedrivesWithUsage
  } catch (error) {
    console.error('Error fetching OneDrives with usage:', error)
    return []
  }
}

// Helper to format last active time
function formatLastActive(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  } else {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
}

// Get sync logs for reports
export async function getSyncLogs(limit: number = 50) {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return logs?.map((log) => ({
      id: log.id,
      type: log.sync_type || 'unknown',
      status: log.status || 'unknown',
      recordsSynced: log.records_synced || 0,
      errorMessage: log.error_message || null,
      startedAt: log.started_at,
      completedAt: log.completed_at,
      durationMs: log.duration_ms || null,
    })) || []
  } catch (error) {
    console.error('Error fetching sync logs:', error)
    return []
  }
}

// Get storage growth trends
export async function getStorageGrowthTrends() {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Get mailbox usage trends
    const { data: mailboxTrends } = await supabaseAdmin
      .from('mailbox_usage')
      .select('report_date, storage_used_bytes')
      .gte('report_date', sixMonthsAgo.toISOString().split('T')[0])
      .order('report_date', { ascending: true })

    // Get OneDrive usage trends
    const { data: onedriveTrends } = await supabaseAdmin
      .from('onedrive_usage')
      .select('report_date, storage_used_bytes')
      .gte('report_date', sixMonthsAgo.toISOString().split('T')[0])
      .order('report_date', { ascending: true })

    // Group by month and calculate totals
    const monthlyData = new Map<string, { mailbox: number; onedrive: number }>()

    mailboxTrends?.forEach((trend) => {
      if (!trend.report_date) return
      const date = new Date(trend.report_date)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const existing = monthlyData.get(monthKey) || { mailbox: 0, onedrive: 0 }
      monthlyData.set(monthKey, {
        ...existing,
        mailbox: existing.mailbox + (trend.storage_used_bytes || 0),
      })
    })

    onedriveTrends?.forEach((trend) => {
      if (!trend.report_date) return
      const date = new Date(trend.report_date)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const existing = monthlyData.get(monthKey) || { mailbox: 0, onedrive: 0 }
      monthlyData.set(monthKey, {
        ...existing,
        onedrive: existing.onedrive + (trend.storage_used_bytes || 0),
      })
    })

    const chartData = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month: month.split(' ')[0],
        mailbox: data.mailbox / (1024 * 1024 * 1024 * 1024), // Convert to TB
        onedrive: data.onedrive / (1024 * 1024 * 1024 * 1024), // Convert to TB
        total: (data.mailbox + data.onedrive) / (1024 * 1024 * 1024 * 1024),
      }))
      .slice(-6) // Last 6 months

    return chartData
  } catch (error) {
    console.error('Error fetching storage growth trends:', error)
    return []
  }
}

// Get license utilization trends
export async function getLicenseUtilizationTrends() {
  try {
    const { data: licenses } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .order('display_name', { ascending: true })

    if (!licenses) return []

    // Get product names for all licenses (batch lookup)
    const licenseData = await Promise.all(
      licenses.map(async (license) => ({
        id: license.id,
        name: license.display_name || await getProductNameFromSku(license.sku_part_number),
        total: license.total_units || 0,
        used: license.consumed_units || 0,
        available: license.available_units || 0,
        utilizationPercent: license.total_units > 0
          ? ((license.consumed_units || 0) / license.total_units) * 100
          : 0,
      }))
    )
    
    return licenseData
  } catch (error) {
    console.error('Error fetching license utilization trends:', error)
    return []
  }
}

// Get user activity summary
export async function getUserActivitySummary() {
  try {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, display_name, account_enabled, created_date_time, last_synced_at')

    if (!users) return { total: 0, active: 0, inactive: 0, newThisMonth: 0 }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const active = users.filter((u) => u.account_enabled).length
    const inactive = users.length - active
    const newThisMonth = users.filter((u) => {
      if (!u.created_date_time) return false
      const created = new Date(u.created_date_time)
      return created >= startOfMonth
    }).length

    return {
      total: users.length,
      active,
      inactive,
      newThisMonth,
    }
  } catch (error) {
    console.error('Error fetching user activity summary:', error)
    return { total: 0, active: 0, inactive: 0, newThisMonth: 0 }
  }
}
