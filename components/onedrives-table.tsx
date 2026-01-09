"use client"

import { useState, useMemo, useEffect } from "react"
import { MoreHorizontal, HardDrive, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { formatBytes } from "@/lib/dashboard-data"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

interface OneDrive {
  id: string
  userId: string
  userName: string
  userEmail: string
  storageUsed: string
  storageUsedBytes: number
  fileCount: number
  activeFileCount: number
  quota: string
  quotaBytes: number
  usagePercent: number
  lastActivity: string
  lastActivityDate: string | null
  reportDate: string | null
  isDeleted: boolean
  siteUrl: string | null
}

interface OneDrivesTableProps {
  onedrives: OneDrive[]
}

const ITEMS_PER_PAGE = 10

export function OneDrivesTable({ onedrives }: OneDrivesTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Filter OneDrives based on search query
  const filteredOneDrives = useMemo(() => {
    if (!searchQuery.trim()) {
      return onedrives
    }

    const query = searchQuery.toLowerCase()
    return onedrives.filter(
      (onedrive) =>
        onedrive.userName.toLowerCase().includes(query) ||
        onedrive.userEmail.toLowerCase().includes(query) ||
        onedrive.storageUsed.toLowerCase().includes(query)
    )
  }, [onedrives, searchQuery])

  // Calculate pagination
  const totalPages = Math.ceil(filteredOneDrives.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedOneDrives = filteredOneDrives.slice(startIndex, endIndex)

  // Calculate summary stats
  const totalStorage = onedrives.reduce((sum, od) => sum + od.storageUsedBytes, 0)
  const totalFiles = onedrives.reduce((sum, od) => sum + od.fileCount, 0)
  const deletedCount = onedrives.filter((od) => od.isDeleted).length
  const activeCount = onedrives.length - deletedCount

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  if (onedrives.length === 0) {
    return (
      <Card className="border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">OneDrive</h2>
          <p className="text-sm text-muted-foreground">Monitor and manage OneDrive storage</p>
        </div>
        <div className="py-12 text-center text-muted-foreground">
          <HardDrive className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No OneDrive accounts found. Sync data from Microsoft Graph to see OneDrive accounts here.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">OneDrive Overview</h2>
            <p className="text-sm text-muted-foreground">
              {filteredOneDrives.length === onedrives.length
                ? `${onedrives.length} total OneDrive account${onedrives.length !== 1 ? "s" : ""}`
                : `Showing ${filteredOneDrives.length} of ${onedrives.length} OneDrive accounts`}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 px-3 py-1.5">
            <HardDrive className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">
              {activeCount} active, {deletedCount} deleted
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Storage</div>
            <div className="text-lg font-semibold">
              {(totalStorage / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Files</div>
            <div className="text-lg font-semibold">{totalFiles.toLocaleString()}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Active Accounts</div>
            <div className="text-lg font-semibold">{activeCount}</div>
          </div>
        </div>
      </Card>

      {/* OneDrives Table */}
      <Card className="border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">All OneDrive Accounts</h2>
          <p className="text-sm text-muted-foreground">Detailed view of all OneDrive storage usage</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search OneDrive accounts by name, email, or storage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filteredOneDrives.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No OneDrive accounts found matching "{searchQuery}"</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Storage Used</th>
                    <th className="pb-3 font-medium">Quota</th>
                    <th className="pb-3 font-medium">Usage</th>
                    <th className="pb-3 font-medium">Files</th>
                    <th className="pb-3 font-medium">Last Activity</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOneDrives.map((onedrive) => {
                    const isHighUsage = onedrive.usagePercent >= 90
                    const isWarningUsage = onedrive.usagePercent >= 80 && onedrive.usagePercent < 90

                    return (
                      <tr
                        key={onedrive.id}
                        className="border-b border-border/50 transition-colors hover:bg-muted/30"
                      >
                        <td className="py-3">
                          <div>
                            <div className="font-medium text-sm">{onedrive.userName}</div>
                            <div className="text-xs text-muted-foreground">
                              {onedrive.userEmail || "No email"}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-sm font-medium">{onedrive.storageUsed}</div>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">{onedrive.quota}</td>
                        <td className="py-3">
                          <div className="w-40 space-y-1">
                            {onedrive.quotaBytes > 0 ? (
                              <>
                                <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                                  <div
                                    className={`h-full transition-all ${
                                      isHighUsage
                                        ? "bg-destructive"
                                        : isWarningUsage
                                          ? "bg-yellow-500"
                                          : "bg-primary"
                                    }`}
                                    style={{ width: `${Math.min(onedrive.usagePercent, 100)}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    {onedrive.usagePercent.toFixed(1)}% used
                                  </span>
                                  <span className="text-muted-foreground">
                                    {formatBytes(Math.max(0, onedrive.quotaBytes - onedrive.storageUsedBytes))} free
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                {onedrive.storageUsed} (Unlimited)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {onedrive.fileCount.toLocaleString()}
                          {onedrive.activeFileCount > 0 && (
                            <span className="text-xs"> ({onedrive.activeFileCount} active)</span>
                          )}
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {onedrive.lastActivity}
                        </td>
                        <td className="py-3">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1)
                            window.scrollTo({ top: 0, behavior: "smooth" })
                          }
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {/* Page Numbers */}
                    {(() => {
                      const pages: (number | "ellipsis")[] = []
                      const showEllipsis = totalPages > 7

                      if (!showEllipsis) {
                        // Show all pages if 7 or fewer
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i)
                        }
                      } else {
                        // Always show first page
                        pages.push(1)

                        if (currentPage <= 4) {
                          // Near the start
                          for (let i = 2; i <= 5; i++) {
                            pages.push(i)
                          }
                          pages.push("ellipsis")
                          pages.push(totalPages)
                        } else if (currentPage >= totalPages - 3) {
                          // Near the end
                          pages.push("ellipsis")
                          for (let i = totalPages - 4; i <= totalPages; i++) {
                            pages.push(i)
                          }
                        } else {
                          // In the middle
                          pages.push("ellipsis")
                          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                            pages.push(i)
                          }
                          pages.push("ellipsis")
                          pages.push(totalPages)
                        }
                      }

                      return pages.map((page, index) => {
                        if (page === "ellipsis") {
                          return (
                            <PaginationItem key={`ellipsis-${index}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )
                        }
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(page)
                                window.scrollTo({ top: 0, behavior: "smooth" })
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })
                    })()}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) {
                            setCurrentPage(currentPage + 1)
                            window.scrollTo({ top: 0, behavior: "smooth" })
                          }
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>

                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredOneDrives.length)} of{" "}
                  {filteredOneDrives.length} OneDrive accounts
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
