import { NextResponse } from 'next/server'
import { getLicenseSummary } from '@/lib/dashboard-data'

export async function GET() {
  try {
    const summary = await getLicenseSummary()
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching license summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch license summary' },
      { status: 500 }
    )
  }
}
