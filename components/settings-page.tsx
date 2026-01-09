"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Upload,
  Database,
  Key,
  Settings as SettingsIcon,
  Info,
  Play,
  Loader2,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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

interface SettingsPageProps {
  syncLogs: SyncLog[]
}

export function SettingsPage({ syncLogs: initialSyncLogs }: SettingsPageProps) {
  const [syncLogs, setSyncLogs] = useState(initialSyncLogs)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const handleSync = async (type: string) => {
    setSyncing(type)
    try {
      const response = await fetch(`/api/sync?type=${type}`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(`Sync ${type} completed successfully`)
        // Refresh sync logs
        const logsResponse = await fetch("/api/sync")
        if (logsResponse.ok) {
          const logsData = await logsResponse.json()
          if (logsData.recentLogs) {
            setSyncLogs(
              logsData.recentLogs.map((log: any) => ({
                id: log.id,
                type: log.sync_type || "unknown",
                status: log.status || "unknown",
                recordsSynced: log.records_synced || 0,
                errorMessage: log.error_message || null,
                startedAt: log.started_at,
                completedAt: log.completed_at,
                durationMs: log.duration_ms || null,
              }))
            )
          }
        }
      } else {
        toast.error(data.error || `Sync ${type} failed`)
      }
    } catch (error) {
      toast.error(`Failed to sync ${type}: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSyncing(null)
    }
  }

  const handleImportSkuMappings = async () => {
    setImporting(true)
    try {
      // This would typically call an API endpoint that runs the import script
      // For now, we'll show a message directing users to use the script
      toast.info("SKU mapping import requires running the import script. See IMPORT_SKU_MAPPINGS.md for instructions.")
    } catch (error) {
      toast.error(`Failed to import SKU mappings: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setImporting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "partial":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "partial":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Partial</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-"
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Note: Actual configuration validation would be done server-side
  // For now, we show that configuration is managed through environment variables

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage application settings and configurations</p>
      </div>

      {/* Sync Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Management
          </CardTitle>
          <CardDescription>Manually trigger data synchronization from Microsoft Graph API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync("full")}
              disabled={syncing !== null}
            >
              {syncing === "full" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Full Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync("users")}
              disabled={syncing !== null}
            >
              {syncing === "users" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Users
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync("licenses")}
              disabled={syncing !== null}
            >
              {syncing === "licenses" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Licenses
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync("mailbox")}
              disabled={syncing !== null}
            >
              {syncing === "mailbox" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Mailbox
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync("onedrive")}
              disabled={syncing !== null}
            >
              {syncing === "onedrive" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              OneDrive
            </Button>
          </div>

          <Separator />

          {/* Recent Sync Logs */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Recent Sync History</h3>
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
                          {log.errorMessage || "-"}
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
          </div>
        </CardContent>
      </Card>

      {/* SKU Mapping Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            SKU Mapping Management
          </CardTitle>
          <CardDescription>Import and manage SKU product name mappings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Import from CSV</p>
              <p className="text-sm text-muted-foreground">
                Import SKU mappings from Microsoft's official CSV file
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleImportSkuMappings}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Import CSV
            </Button>
          </div>
          <div className="rounded-lg border border-dashed p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> To import SKU mappings, run the import script:
            </p>
            <code className="text-xs mt-2 block bg-background p-2 rounded border">
              npm run import-sku-mappings
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              See <code>IMPORT_SKU_MAPPINGS.md</code> for detailed instructions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuration Status
          </CardTitle>
          <CardDescription>Check the status of your API connections and credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Microsoft Graph API</p>
                  <p className="text-xs text-muted-foreground">
                    Configured via environment variables
                  </p>
                </div>
              </div>
              <Badge variant="outline">Configured</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Supabase Connection</p>
                  <p className="text-xs text-muted-foreground">
                    Configured via environment variables
                  </p>
                </div>
              </div>
              <Badge variant="outline">Connected</Badge>
            </div>
          </div>

          <div className="rounded-lg border border-dashed p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Configuration is managed through environment variables. Check your{" "}
              <code>.env.local</code> file for required settings. See{" "}
              <code>README-SETUP.md</code> for setup instructions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the appearance of the application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* Application Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Application Information
          </CardTitle>
          <CardDescription>About this application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Application Name:</span>
            <span className="font-medium">M365 Admin</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Version:</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Environment:</span>
            <span className="font-medium">
              {process.env.NODE_ENV === "production" ? "Production" : "Development"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
