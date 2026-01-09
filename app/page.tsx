import { M365Dashboard } from "@/components/m365-dashboard"
import { 
  getDashboardStats, 
  getUsersWithUsage, 
  getLicenseOverview,
  getMailboxUsageData,
  getOneDriveUsageData 
} from "@/lib/dashboard-data"

export default async function Page() {
  // Fetch all dashboard data in parallel
  const [stats, users, licenses, mailboxData, onedriveData] = await Promise.all([
    getDashboardStats(),
    getUsersWithUsage(),
    getLicenseOverview(),
    getMailboxUsageData(),
    getOneDriveUsageData(),
  ])

  return (
    <M365Dashboard 
      stats={stats}
      users={users}
      licenses={licenses}
      mailboxData={mailboxData}
      onedriveData={onedriveData}
    />
  )
}
