import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AvatarGroup } from "@/components/avatar-group"

const activities = [
  {
    date: "Yesterday",
    user: { name: "You", avatar: "/placeholder.svg?height=32&width=32" },
    action: "shared edit access to",
    target: "Miko",
    targetAvatar: "/placeholder.svg?height=32&width=32",
  },
  {
    date: "Yesterday",
    user: { name: "You", avatar: "/placeholder.svg?height=32&width=32" },
    action: "shared edit access to",
    target: "Ashley",
    targetAvatar: "/placeholder.svg?height=32&width=32",
  },
  {
    date: "Apr 1, 2022",
    user: { name: "You", avatar: "/placeholder.svg?height=32&width=32" },
    action: "changed",
    target: "Maszeh.glyph",
    file: "Maszeh.glyph",
  },
  {
    date: "Feb 21, 2022",
    user: { name: "You", avatar: "/placeholder.svg?height=32&width=32" },
    action: "added tag",
    tag: "Work",
  },
  {
    date: "Feb 16, 2022",
    user: { name: "You", avatar: "/placeholder.svg?height=32&width=32" },
    action: "change edit to view access to",
    target: "Nolan",
    targetAvatar: "/placeholder.svg?height=32&width=32",
  },
]

export function FileSidebar() {
  return (
    <Card className="w-80 flex-shrink-0 border-border bg-card p-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-primary" />
          <div>
            <h3 className="font-semibold">Source</h3>
            <p className="text-xs text-muted-foreground">1.2 MB • Yesterday • 1 item</p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tags</span>
          <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary">
            Edit
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
            Work
          </Badge>
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
            Source
          </Badge>
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
            Font
          </Badge>
        </div>
      </div>

      {/* Sharing */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Sharing</span>
          <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary">
            Manage
          </Button>
        </div>
        <AvatarGroup
          avatars={[
            "/placeholder.svg?height=32&width=32",
            "/placeholder.svg?height=32&width=32",
            "/placeholder.svg?height=32&width=32",
            "/placeholder.svg?height=32&width=32",
          ]}
          max={4}
          size="md"
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex border-b border-border">
        <Button
          variant="ghost"
          className="relative rounded-none border-b-2 border-primary px-0 pb-2 text-sm font-medium"
        >
          Activity
        </Button>
        <Button variant="ghost" className="rounded-none px-4 pb-2 text-sm text-muted-foreground">
          Comments
        </Button>
        <Button variant="ghost" className="rounded-none px-4 pb-2 text-sm text-muted-foreground">
          Versions
        </Button>
      </div>

      {/* Activity Feed */}
      <div className="space-y-6">
        {activities.map((activity, i) => (
          <div key={i} className="relative flex gap-3 pl-3">
            {/* Timeline dot */}
            <div className="absolute left-0 top-0 h-2 w-2 rounded-full bg-primary" />

            <div className="flex-1">
              <p className="mb-2 text-xs text-muted-foreground">{activity.date}</p>
              <div className="flex items-start gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={activity.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-sm">
                  <span className="text-foreground">{activity.action} </span>
                  {activity.target && (
                    <>
                      {activity.targetAvatar && (
                        <Avatar className="inline-flex h-4 w-4 align-middle">
                          <AvatarImage src={activity.targetAvatar || "/placeholder.svg"} />
                          <AvatarFallback>T</AvatarFallback>
                        </Avatar>
                      )}
                      <span className="font-medium"> {activity.target}</span>
                    </>
                  )}
                  {activity.file && <div className="mt-1 text-xs text-muted-foreground">{activity.file}</div>}
                  {activity.tag && (
                    <Badge variant="secondary" className="ml-1 bg-muted text-xs">
                      {activity.tag}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
