import { NextRequest, NextResponse } from 'next/server'
import { getUsersByLicense } from '@/lib/dashboard-data'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const licenseId = searchParams.get('licenseId')

    if (!licenseId) {
      return NextResponse.json(
        { error: 'License ID is required' },
        { status: 400 }
      )
    }

    const users = await getUsersByLicense(licenseId)

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users by license:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
