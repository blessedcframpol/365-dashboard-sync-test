import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/top-nav"
import { MailboxesTable } from "@/components/mailboxes-table"
import { getMailboxesWithUsage } from "@/lib/dashboard-data"

export default async function MailboxesPage() {
  const mailboxes = await getMailboxesWithUsage()

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <TopNav />

        <main className="flex flex-1 gap-4 overflow-hidden p-6">
          <div className="flex flex-1 flex-col gap-6 overflow-auto">
            <MailboxesTable mailboxes={mailboxes} />
          </div>
        </main>
      </div>
    </div>
  )
}
