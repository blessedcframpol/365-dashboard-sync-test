import { Key, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface License {
  id: string
  name: string
  total: number
  used: number
  available: number
}

interface LicensesOverviewProps {
  licenses: License[]
}

export function LicensesOverview({ licenses }: LicensesOverviewProps) {
  const totalLicenses = licenses.reduce((sum, lic) => sum + lic.total, 0)
  const usedLicenses = licenses.reduce((sum, lic) => sum + lic.used, 0)
  const usagePercent = totalLicenses > 0 ? (usedLicenses / totalLicenses) * 100 : 0

  if (licenses.length === 0) {
    return (
      <Card className="border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">License Overview</h2>
            <p className="text-sm text-muted-foreground">Track license allocation and usage</p>
          </div>
        </div>
        <div className="py-12 text-center text-muted-foreground">
          No licenses found. Sync data from Microsoft Graph to see licenses here.
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">License Overview</h2>
          <p className="text-sm text-muted-foreground">Track license allocation and usage</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
          <Key className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {usedLicenses} / {totalLicenses} used
          </span>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Overall Usage</span>
          <span className="font-medium">{usagePercent.toFixed(1)}%</span>
        </div>
        <Progress value={usagePercent} className="h-2" />
      </div>

      <div className="space-y-4">
        {licenses.map((license) => {
          const licenseUsage = license.total > 0 ? (license.used / license.total) * 100 : 0
          return (
            <div key={license.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{license.name}</span>
                  {license.available === 0 && license.total > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      Full
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {license.used} / {license.total}
                </span>
              </div>
              <Progress value={licenseUsage} className="h-1.5" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{license.available} available</span>
                <span>{licenseUsage.toFixed(1)}% used</span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

