"use client"

import { HardDrive, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface OneDriveData {
  chartData: Array<{ month: string; usage: number }>
  topOneDrives: Array<{ user: string; size: string; percent: number }>
  totalUsage: number
}

interface OneDriveUsageProps {
  data: OneDriveData
}

export function OneDriveUsage({ data }: OneDriveUsageProps) {
  const totalUsage = data.totalUsage / (1024 * 1024 * 1024 * 1024) // Convert to TB
  const quota = 3.0 // Default quota, could be fetched from config
  const usagePercent = (totalUsage / quota) * 100

  // Ensure we have at least some data for the chart
  const chartData = data.chartData.length > 0 
    ? data.chartData 
    : [
        { month: "Jan", usage: 0 },
        { month: "Feb", usage: 0 },
        { month: "Mar", usage: 0 },
        { month: "Apr", usage: 0 },
        { month: "May", usage: 0 },
        { month: "Jun", usage: 0 },
      ]

  return (
    <Card className="border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">OneDrive Usage</h2>
          <p className="text-sm text-muted-foreground">Track cloud storage consumption</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 px-3 py-1.5">
          <HardDrive className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium">{totalUsage.toFixed(1)} TB</span>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Usage</span>
          <span className="font-medium">
            {totalUsage.toFixed(1)} TB / {quota} TB
          </span>
        </div>
        <Progress value={usagePercent} className="h-2" />
      </div>

      <div className="mb-6 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              formatter={(value: number) => `${value.toFixed(2)} TB`}
            />
            <Area
              type="monotone"
              dataKey="usage"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Top OneDrive Accounts</h3>
        {data.topOneDrives.length > 0 ? (
          <div className="space-y-3">
            {data.topOneDrives.map((onedrive, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{onedrive.user}</span>
                  <span className="text-muted-foreground">{onedrive.size}</span>
                </div>
                <Progress value={onedrive.percent * 100} className="h-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No OneDrive data available
          </div>
        )}
      </div>
    </Card>
  )
}

