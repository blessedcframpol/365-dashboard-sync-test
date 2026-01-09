import { NextRequest, NextResponse } from 'next/server'
import { fullSync, syncUsers, syncLicenses, syncMailboxUsage, syncOneDriveUsage } from '@/lib/sync-service'

/**
 * POST /api/sync
 * Syncs data from Microsoft Graph API to Supabase
 * 
 * Query parameters:
 * - type: 'full' | 'users' | 'licenses' | 'mailbox' | 'onedrive' (default: 'full')
 * - secret: Optional secret for authentication (if CRON_SECRET is set)
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Check for cron secret if set
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      const providedSecret = authHeader?.replace('Bearer ', '') || 
                            request.nextUrl.searchParams.get('secret')
      
      if (providedSecret !== cronSecret) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const syncType = searchParams.get('type') || 'full'

    let result

    switch (syncType) {
      case 'users':
        result = await syncUsers()
        break
      case 'licenses':
        result = await syncLicenses()
        break
      case 'mailbox':
        result = await syncMailboxUsage()
        break
      case 'onedrive':
        result = await syncOneDriveUsage()
        break
      case 'full':
      default:
        result = await fullSync()
        break
    }

    return NextResponse.json({
      success: true,
      syncType,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sync
 * Returns sync status and recent sync logs
 */
export async function GET(request: NextRequest) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    const { data: recentLogs, error } = await supabaseAdmin
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      recentLogs,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching sync logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

