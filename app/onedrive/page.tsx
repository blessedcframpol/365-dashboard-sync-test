import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/top-nav"
import { OneDrivesTable } from "@/components/onedrives-table"
import { getOneDrivesWithUsage } from "@/lib/dashboard-data"

export default async function OneDrivePage() {
  const onedrives = await getOneDrivesWithUsage()

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <TopNav />

        <main className="flex flex-1 gap-4 overflow-hidden p-6">
          <div className="flex flex-1 flex-col gap-6 overflow-auto">
            <OneDrivesTable onedrives={onedrives} />
          </div>
        </main>
      </div>
    </div>
  )
}
