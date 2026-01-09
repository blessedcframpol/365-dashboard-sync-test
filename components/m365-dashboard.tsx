import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/top-nav"
import { OverviewCards } from "@/components/overview-cards"
import { UsersTable } from "@/components/users-table"
import { LicensesOverview } from "@/components/licenses-overview"
import { MailboxUsage } from "@/components/mailbox-usage"
import { OneDriveUsage } from "@/components/onedrive-usage"

interface DashboardStats {
  totalUsers: number
  activeLicenses: number
  totalMailboxBytes: number
  totalOneDriveBytes: number
}

interface User {
  id: string
  name: string
  email: string
  role: string
  license: string
  status: string
  mailbox: string
  onedrive: string
  lastActive: string
}

interface License {
  id: string
  name: string
  total: number
  used: number
  available: number
}

interface MailboxData {
  chartData: Array<{ month: string; usage: number }>
  topMailboxes: Array<{ user: string; size: string; percent: number }>
  totalUsage: number
}

interface OneDriveData {
  chartData: Array<{ month: string; usage: number }>
  topOneDrives: Array<{ user: string; size: string; percent: number }>
  totalUsage: number
}

interface M365DashboardProps {
  stats: DashboardStats
  users: User[]
  licenses: License[]
  mailboxData: MailboxData
  onedriveData: OneDriveData
}

export function M365Dashboard({ 
  stats, 
  users, 
  licenses, 
  mailboxData, 
  onedriveData 
}: M365DashboardProps) {
  return (
    <div className="flex h-screen bg-muted/30">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <TopNav />

        <main className="flex flex-1 gap-4 overflow-hidden p-6">
          <div className="flex flex-1 flex-col gap-6 overflow-auto">
            <OverviewCards stats={stats} />
            <UsersTable users={users} />
            <div className="grid grid-cols-2 gap-6">
              <LicensesOverview licenses={licenses} />
              <MailboxUsage data={mailboxData} />
            </div>
            <OneDriveUsage data={onedriveData} />
          </div>
        </main>
      </div>
    </div>
  )
}

