"use client"

import { useState, useMemo } from "react"
import { MoreHorizontal, Key, Search, AlertCircle, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface License {
  id: string
  name: string
  total: number
  used: number
  actualUsers: number
  available: number
}

interface LicensesTableProps {
  licenses: License[]
}

interface UserWithLicense {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: string
}

export function LicensesTable({ licenses }: LicensesTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [users, setUsers] = useState<UserWithLicense[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")

  // Filter licenses based on search query
  const filteredLicenses = useMemo(() => {
    if (!searchQuery.trim()) {
      return licenses
    }

    const query = searchQuery.toLowerCase()
    return licenses.filter((license) => license.name.toLowerCase().includes(query))
  }, [licenses, searchQuery])

  // Calculate overall stats
  const totalLicenses = licenses.reduce((sum, lic) => sum + lic.total, 0)
  const usedLicenses = licenses.reduce((sum, lic) => sum + lic.actualUsers, 0)
  const overallUsage = totalLicenses > 0 ? (usedLicenses / totalLicenses) * 100 : 0

  // Handle license click
  const handleLicenseClick = async (license: License) => {
    setSelectedLicense(license)
    setUserSearchQuery("") // Reset search when opening dialog
    setIsDialogOpen(true)
    setLoading(true)
    try {
      const response = await fetch(`/api/license-users?licenseId=${license.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Filter users in dialog
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) {
      return users
    }
    const query = userSearchQuery.toLowerCase()
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query)
    )
  }, [users, userSearchQuery])

  if (licenses.length === 0) {
    return (
      <Card className="border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Licenses</h2>
          <p className="text-sm text-muted-foreground">Manage and monitor license allocation</p>
        </div>
        <div className="py-12 text-center text-muted-foreground">
          <Key className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No licenses found. Sync data from Microsoft Graph to see licenses here.</p>
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
            <h2 className="text-lg font-semibold">License Overview</h2>
            <p className="text-sm text-muted-foreground">
              {filteredLicenses.length === licenses.length
                ? `${licenses.length} total license${licenses.length !== 1 ? "s" : ""}`
                : `Showing ${filteredLicenses.length} of ${licenses.length} licenses`}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
            <Key className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {usedLicenses} / {totalLicenses} used
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Usage</span>
            <span className="font-medium">{overallUsage.toFixed(1)}%</span>
          </div>
          <Progress value={overallUsage} className="h-2" />
        </div>
      </Card>

      {/* Licenses Table */}
      <Card className="border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">All Licenses</h2>
          <p className="text-sm text-muted-foreground">Detailed view of all license subscriptions</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search licenses by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filteredLicenses.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No licenses found matching "{searchQuery}"</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">License Name</th>
                    <th className="pb-3 font-medium">Usage</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Used</th>
                    <th className="pb-3 font-medium">Available</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLicenses.map((license) => {
                    const licenseUsage = license.total > 0 ? (license.actualUsers / license.total) * 100 : 0
                    const isFull = licenseUsage >= 90
                    const isLow = licenseUsage >= 80 && licenseUsage < 90

                    return (
                      <tr
                        key={license.id}
                        className="border-b border-border/50 transition-colors hover:bg-muted/30"
                      >
                        <td className="py-3">
                          <div>
                            <button
                              onClick={() => handleLicenseClick(license)}
                              className="font-medium text-sm hover:text-primary hover:underline cursor-pointer text-left"
                            >
                              {license.name}
                            </button>
                            <div className="text-xs text-muted-foreground">
                              {licenseUsage.toFixed(1)}% utilized
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="w-32">
                            <Progress
                              value={licenseUsage}
                              indicatorClassName={
                                isFull
                                  ? "bg-destructive"
                                  : isLow
                                    ? "bg-yellow-500"
                                    : "bg-primary"
                              }
                            />
                          </div>
                        </td>
                    <td className="py-3 text-sm font-medium">{license.total}</td>
                    <td className="py-3 text-sm text-muted-foreground">{license.actualUsers}</td>
                    <td className="py-3 text-sm text-muted-foreground">{license.available}</td>
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
          </>
        )}
      </Card>

      {/* Users Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users with {selectedLicense?.name || 'License'}
            </DialogTitle>
            <DialogDescription>
              {selectedLicense && (
                <span>
                  {selectedLicense.actualUsers} user{selectedLicense.actualUsers !== 1 ? 's' : ''} assigned
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No users assigned to this license</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search users by name, email, role, or department..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* User Count */}
              <div className="text-sm text-muted-foreground">
                {filteredUsers.length === users.length
                  ? `${users.length} user${users.length !== 1 ? 's' : ''}`
                  : `Showing ${filteredUsers.length} of ${users.length} users`}
              </div>

              {/* Users List */}
              {filteredUsers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No users found matching "{userSearchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                      {user.role && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {user.role}
                          {user.department && ` • ${user.department}`}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={user.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {user.status}
                    </Badge>
                  </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
