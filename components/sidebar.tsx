"use client"

import { Users, Key, Mail, HardDrive, LayoutDashboard, Settings, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function Sidebar() {
  const pathname = usePathname()
  const [licenseSummary, setLicenseSummary] = useState<{ total: number; used: number } | null>(null)

  useEffect(() => {
    async function fetchLicenseSummary() {
      try {
        const response = await fetch('/api/license-summary')
        if (response.ok) {
          const data = await response.json()
          setLicenseSummary(data)
        }
      } catch (error) {
        console.error('Error fetching license summary:', error)
      }
    }
    fetchLicenseSummary()
  }, [])

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg className="h-5 w-5 text-primary-foreground" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
                fill="currentColor"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold">M365 Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <Button 
          variant={pathname === "/" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3" 
          size="sm"
          asChild
        >
          <Link href="/">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button 
          variant={pathname === "/users" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3" 
          size="sm"
          asChild
        >
          <Link href="/users">
            <Users className="h-4 w-4" />
            Users
          </Link>
        </Button>
        <Button 
          variant={pathname === "/licenses" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3" 
          size="sm"
          asChild
        >
          <Link href="/licenses">
            <Key className="h-4 w-4" />
            Licenses
          </Link>
        </Button>
        <Button 
          variant={pathname === "/mailboxes" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3" 
          size="sm"
          asChild
        >
          <Link href="/mailboxes">
            <Mail className="h-4 w-4" />
            Mailboxes
          </Link>
        </Button>
        <Button 
          variant={pathname === "/onedrive" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3" 
          size="sm"
          asChild
        >
          <Link href="/onedrive">
            <HardDrive className="h-4 w-4" />
            OneDrive
          </Link>
        </Button>
        <Button 
          variant={pathname === "/reports" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3" 
          size="sm"
          asChild
        >
          <Link href="/reports">
            <BarChart3 className="h-4 w-4" />
            Reports
          </Link>
        </Button>
      </nav>

      {/* Bottom Section */}
      <div className="space-y-1 border-t border-border p-4">
        <Button 
          variant={pathname === "/settings" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3" 
          size="sm"
          asChild
        >
          <Link href="/settings">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </Button>

        {/* License Summary */}
        <div className="mt-4 space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-sm">
            <Key className="h-4 w-4" />
            <span className="font-medium">Licenses</span>
          </div>
          {licenseSummary ? (
            <>
              <Progress 
                value={licenseSummary.total > 0 ? (licenseSummary.used / licenseSummary.total) * 100 : 0} 
                className="h-1.5" 
              />
              <p className="text-xs text-muted-foreground">
                {licenseSummary.used} of {licenseSummary.total} used
              </p>
            </>
          ) : (
            <>
              <Progress value={0} className="h-1.5" />
              <p className="text-xs text-muted-foreground">Loading...</p>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
