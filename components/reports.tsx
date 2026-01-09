"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { CheckCircle2, XCircle, AlertCircle, Clock, TrendingUp, Users, HardDrive, Mail } from "lucide-react"
import { formatBytes } from "@/lib/dashboard-data"

interface SyncLog {
  id: string
  type: string
  status: string
  recordsSynced: number
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
  durationMs: number | null
}

interface StorageTrend {
  month: string
  mailbox: number
  onedrive: number
  total: number
}

interface LicenseUtilization {
  id: string
  name: string
  total: number
  used: number
  available: number
  utilizationPercent: number
}

interface UserActivity {
  total: number
  active: number
  inactive: number
  newThisMonth: number
}

interface ReportsProps {
  syncLogs: SyncLog[]
  storageTrends: StorageTrend[]
  licenseUtilization: LicenseUtilization[]
  userActivity: UserActivity
}

export function Reports({
  syncLogs,
  storageTrends,
  licenseUtilization,
  userActivity,
}: ReportsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'partial':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Partial</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{userActivity.total}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {userActivity.active} active, {userActivity.inactive} inactive
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">New This Month</p>
              <p className="text-2xl font-bold">{userActivity.newThisMonth}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Licenses</p>
              <p className="text-2xl font-bold">
                {licenseUtilization.reduce((sum, lic) => sum + lic.used, 0)}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            of {licenseUtilization.reduce((sum, lic) => sum + lic.total, 0)} total
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recent Syncs</p>
              <p className="text-2xl font-bold">{syncLogs.length}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {syncLogs.filter((log) => log.status === 'success').length} successful
          </div>
        </Card>
      </div>

      {/* Storage Growth Trends */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Storage Growth Trends</h2>
          <p className="text-sm text-muted-foreground">Combined mailbox and OneDrive usage over time</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={storageTrends}>
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
              <Legend />
              <Line
                type="monotone"
                dataKey="mailbox"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Mailbox"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="onedrive"
                stroke="hsl(221.2 83.2% 53.3%)"
                strokeWidth={2}
                name="OneDrive"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(142.1 76.2% 36.3%)"
                strokeWidth={2}
                name="Total"
                dot={{ r: 4 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* License Utilization */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">License Utilization</h2>
          <p className="text-sm text-muted-foreground">Current license usage across all SKUs</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={licenseUtilization}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                angle={-45}
                textAnchor="end"
                height={100}
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
                formatter={(value: number) => value.toLocaleString()}
              />
              <Legend />
              <Bar dataKey="used" fill="hsl(var(--primary))" name="Used" radius={[4, 4, 0, 0]} />
              <Bar dataKey="available" fill="hsl(var(--muted))" name="Available" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Sync Logs Table */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Sync History</h2>
          <p className="text-sm text-muted-foreground">Recent synchronization operations</p>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncLogs.length > 0 ? (
                syncLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium capitalize">
                      {log.type}
                    </TableCell>
                    <TableCell>{log.recordsSynced.toLocaleString()}</TableCell>
                    <TableCell>{formatDuration(log.durationMs)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(log.startedAt)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-red-500">
                      {log.errorMessage || '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No sync logs available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* License Details Table */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">License Details</h2>
          <p className="text-sm text-muted-foreground">Detailed license utilization breakdown</p>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Name</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenseUtilization.length > 0 ? (
                licenseUtilization.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">{license.name}</TableCell>
                    <TableCell>{license.total.toLocaleString()}</TableCell>
                    <TableCell>{license.used.toLocaleString()}</TableCell>
                    <TableCell>{license.available.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="h-2 w-32 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${Math.min(license.utilizationPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {license.utilizationPercent.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No license data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
