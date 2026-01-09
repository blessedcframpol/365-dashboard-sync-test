"use client"

import { useState, useMemo, useEffect } from "react"
import { MoreHorizontal, Mail, Search, AlertCircle } from "lucide-react"
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

interface Mailbox {
  id: string
  userId: string
  userName: string
  userEmail: string
  storageUsed: string
  storageUsedBytes: number
  itemCount: number
  quota: string
  quotaBytes: number
  usagePercent: number
  lastActivity: string
  lastActivityDate: string | null
  reportDate: string | null
  isDeleted: boolean
  warningQuota: string | null
}

interface MailboxesTableProps {
  mailboxes: Mailbox[]
}

const ITEMS_PER_PAGE = 10

export function MailboxesTable({ mailboxes }: MailboxesTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Filter mailboxes based on search query
  const filteredMailboxes = useMemo(() => {
    if (!searchQuery.trim()) {
      return mailboxes
    }

    const query = searchQuery.toLowerCase()
    return mailboxes.filter(
      (mailbox) =>
        mailbox.userName.toLowerCase().includes(query) ||
        mailbox.userEmail.toLowerCase().includes(query) ||
        mailbox.storageUsed.toLowerCase().includes(query)
    )
  }, [mailboxes, searchQuery])

  // Calculate pagination
  const totalPages = Math.ceil(filteredMailboxes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedMailboxes = filteredMailboxes.slice(startIndex, endIndex)

  // Calculate summary stats
  const totalStorage = mailboxes.reduce((sum, mb) => sum + mb.storageUsedBytes, 0)
  const totalItems = mailboxes.reduce((sum, mb) => sum + mb.itemCount, 0)
  const deletedCount = mailboxes.filter((mb) => mb.isDeleted).length
  const activeCount = mailboxes.length - deletedCount

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  if (mailboxes.length === 0) {
    return (
      <Card className="border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Mailboxes</h2>
          <p className="text-sm text-muted-foreground">Monitor and manage mailbox storage</p>
        </div>
        <div className="py-12 text-center text-muted-foreground">
          <Mail className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No mailboxes found. Sync data from Microsoft Graph to see mailboxes here.</p>
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
            <h2 className="text-lg font-semibold">Mailbox Overview</h2>
            <p className="text-sm text-muted-foreground">
              {filteredMailboxes.length === mailboxes.length
                ? `${mailboxes.length} total mailbox${mailboxes.length !== 1 ? "es" : ""}`
                : `Showing ${filteredMailboxes.length} of ${mailboxes.length} mailboxes`}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-purple-100 dark:bg-purple-900/20 px-3 py-1.5">
            <Mail className="h-4 w-4 text-purple-600" />
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
            <div className="text-sm text-muted-foreground">Total Items</div>
            <div className="text-lg font-semibold">{totalItems.toLocaleString()}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Active Mailboxes</div>
            <div className="text-lg font-semibold">{activeCount}</div>
          </div>
        </div>
      </Card>

      {/* Mailboxes Table */}
      <Card className="border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">All Mailboxes</h2>
          <p className="text-sm text-muted-foreground">Detailed view of all mailbox storage usage</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search mailboxes by name, email, or storage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filteredMailboxes.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No mailboxes found matching "{searchQuery}"</p>
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
                    <th className="pb-3 font-medium">Items</th>
                    <th className="pb-3 font-medium">Last Activity</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMailboxes.map((mailbox) => {
                    const isHighUsage = mailbox.usagePercent >= 90
                    const isWarningUsage = mailbox.usagePercent >= 80 && mailbox.usagePercent < 90

                    return (
                      <tr
                        key={mailbox.id}
                        className="border-b border-border/50 transition-colors hover:bg-muted/30"
                      >
                        <td className="py-3">
                          <div>
                            <div className="font-medium text-sm">{mailbox.userName}</div>
                            <div className="text-xs text-muted-foreground">
                              {mailbox.userEmail || "No email"}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-sm font-medium">{mailbox.storageUsed}</div>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">{mailbox.quota}</td>
                        <td className="py-3">
                          <div className="w-40 space-y-1">
                            {mailbox.quotaBytes > 0 ? (
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
                                    style={{ width: `${Math.min(mailbox.usagePercent, 100)}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    {mailbox.usagePercent.toFixed(1)}% used
                                  </span>
                                  <span className="text-muted-foreground">
                                    {formatBytes(Math.max(0, mailbox.quotaBytes - mailbox.storageUsedBytes))} free
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                {mailbox.storageUsed} (Unlimited)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {mailbox.itemCount.toLocaleString()}
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {mailbox.lastActivity}
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredMailboxes.length)} of{" "}
                  {filteredMailboxes.length} mailboxes
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
