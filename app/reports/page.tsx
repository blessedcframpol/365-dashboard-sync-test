import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/top-nav"
import { Reports } from "@/components/reports"
import {
  getSyncLogs,
  getStorageGrowthTrends,
  getLicenseUtilizationTrends,
  getUserActivitySummary,
} from "@/lib/dashboard-data"

export default async function ReportsPage() {
  const [syncLogs, storageTrends, licenseUtilization, userActivity] = await Promise.all([
    getSyncLogs(50),
    getStorageGrowthTrends(),
    getLicenseUtilizationTrends(),
    getUserActivitySummary(),
  ])

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <TopNav />

        <main className="flex flex-1 gap-4 overflow-hidden p-6">
          <div className="flex flex-1 flex-col gap-6 overflow-auto">
            <Reports
              syncLogs={syncLogs}
              storageTrends={storageTrends}
              licenseUtilization={licenseUtilization}
              userActivity={userActivity}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
