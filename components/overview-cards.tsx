import { Users, Key, Mail, HardDrive } from "lucide-react"
import { Card } from "@/components/ui/card"
import { formatBytesToTB } from "@/lib/dashboard-data"

interface DashboardStats {
  totalUsers: number
  activeLicenses: number
  totalMailboxBytes: number
  totalOneDriveBytes: number
}

interface OverviewCardsProps {
  stats: DashboardStats
}

export function OverviewCards({ stats }: OverviewCardsProps) {
  const statsData = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-900/50",
    },
    {
      title: "Active Licenses",
      value: stats.activeLicenses.toLocaleString(),
      icon: Key,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-900/50",
    },
    {
      title: "Mailbox Usage",
      value: formatBytesToTB(stats.totalMailboxBytes),
      icon: Mail,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-900/50",
    },
    {
      title: "OneDrive Usage",
      value: formatBytesToTB(stats.totalOneDriveBytes),
      icon: HardDrive,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      borderColor: "border-orange-200 dark:border-orange-900/50",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, i) => {
        const Icon = stat.icon
        return (
          <Card
            key={i}
            className={`group relative flex h-32 overflow-hidden border-2 transition-all hover:shadow-md ${stat.borderColor}`}
          >
            <div className="flex w-full items-start justify-between p-5">
              <div className="flex-1 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
              </div>
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${stat.bgColor}`}
              >
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

