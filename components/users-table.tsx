"use client"

import { useState, useMemo, useEffect } from "react"
import { MoreHorizontal, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

interface User {
  id: string
  name: string
  email: string
  role: string
  licenses: string[]
  status: string
  mailbox: string
  onedrive: string
  lastActive: string
}

interface UsersTableProps {
  users: User[]
}

const ITEMS_PER_PAGE = 10

export function UsersTable({ users }: UsersTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedLicenses, setExpandedLicenses] = useState<Set<string>>(new Set())

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users
    }

    const query = searchQuery.toLowerCase()
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query) ||
        user.licenses.some(license => license?.toLowerCase().includes(query))
    )
  }, [users, searchQuery])

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  if (users.length === 0) {
    return (
      <Card className="border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">Manage and monitor user accounts</p>
        </div>
        <div className="py-12 text-center text-muted-foreground">
          No users found. Sync data from Microsoft Graph to see users here.
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Users</h2>
        <p className="text-sm text-muted-foreground">
          {filteredUsers.length === users.length
            ? `${users.length} total users`
            : `Showing ${filteredUsers.length} of ${users.length} users`}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users by name, email, role, or license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No users found matching "{searchQuery}"
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium w-[200px]">User</th>
                  <th className="pb-3 font-medium w-[120px]">Role</th>
                  <th className="pb-3 font-medium w-[200px]">License</th>
                  <th className="pb-3 font-medium w-[100px]">Mailbox</th>
                  <th className="pb-3 font-medium w-[100px]">OneDrive</th>
                  <th className="pb-3 font-medium w-[120px]">Last Active</th>
                  <th className="pb-3 w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/30"
                  >
                    <td className="py-3">
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {user.licenses.length > 0 ? (
                        <div className="flex flex-col gap-1.5 max-w-[200px]">
                          {(expandedLicenses.has(user.id) 
                            ? user.licenses 
                            : user.licenses.slice(0, 2)
                          ).map((license, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs w-fit"
                            >
                              {license}
                            </Badge>
                          ))}
                          {user.licenses.length > 2 && !expandedLicenses.has(user.id) && (
                            <button
                              onClick={() => setExpandedLicenses(prev => new Set(prev).add(user.id))}
                              className="text-xs text-primary hover:underline text-left w-fit"
                            >
                              +{user.licenses.length - 2} more
                            </button>
                          )}
                          {expandedLicenses.has(user.id) && user.licenses.length > 2 && (
                            <button
                              onClick={() => {
                                const newSet = new Set(expandedLicenses)
                                newSet.delete(user.id)
                                setExpandedLicenses(newSet)
                              }}
                              className="text-xs text-muted-foreground hover:underline text-left w-fit"
                            >
                              Show less
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No licenses</span>
                      )}
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">{user.mailbox}</td>
                    <td className="py-3 text-sm text-muted-foreground">{user.onedrive}</td>
                    <td className="py-3 text-sm text-muted-foreground">{user.lastActive}</td>
                    <td className="py-3">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of{" "}
                {filteredUsers.length} users
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

