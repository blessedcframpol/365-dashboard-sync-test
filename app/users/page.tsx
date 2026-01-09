import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/top-nav"
import { UsersTable } from "@/components/users-table"
import { getUsersWithUsage } from "@/lib/dashboard-data"

export default async function UsersPage() {
  const users = await getUsersWithUsage()

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <TopNav />

        <main className="flex flex-1 gap-4 overflow-hidden p-6">
          <div className="flex flex-1 flex-col gap-6 overflow-auto">
            <UsersTable users={users} />
          </div>
        </main>
      </div>
    </div>
  )
}
