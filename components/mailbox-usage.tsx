"use client"

import { Mail, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatBytesToTB } from "@/lib/dashboard-data"

interface MailboxData {
  chartData: Array<{ month: string; usage: number }>
  topMailboxes: Array<{ user: string; size: string; percent: number }>
  totalUsage: number
}

interface MailboxUsageProps {
  data: MailboxData
}

export function MailboxUsage({ data }: MailboxUsageProps) {
  const totalUsage = data.totalUsage / (1024 * 1024 * 1024 * 1024) // Convert to TB
  const quota = 5.0 // Default quota, could be fetched from config
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
          <h2 className="text-lg font-semibold">Mailbox Usage</h2>
          <p className="text-sm text-muted-foreground">Monitor email storage consumption</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-purple-100 dark:bg-purple-900/20 px-3 py-1.5">
          <Mail className="h-4 w-4 text-purple-600" />
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
          <BarChart data={chartData}>
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
            <Bar dataKey="usage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Top Mailboxes</h3>
        {data.topMailboxes.length > 0 ? (
          <div className="space-y-3">
            {data.topMailboxes.map((mailbox, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{mailbox.user}</span>
                  <span className="text-muted-foreground">{mailbox.size}</span>
                </div>
                <Progress value={mailbox.percent * 100} className="h-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No mailbox data available
          </div>
        )}
      </div>
    </Card>
  )
}

