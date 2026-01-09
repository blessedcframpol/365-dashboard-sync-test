import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const quickAccessItems = [
  { name: "Studio Work", size: "2.3 GB", items: 23, color: "bg-primary" },
  { name: "Source", size: "1.2 MB", items: 1, color: "bg-primary" },
  { name: "Brand Assets", size: "241 MB", items: 8, color: "bg-primary" },
  { name: "Great Studios Pitch...", size: "12.3 MB", items: "pptx", color: "bg-orange-500" },
]

export function QuickAccess() {
  return (
    <Card className="border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Quick Access</h2>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {quickAccessItems.map((item, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50"
          >
            <div className={`h-10 w-10 rounded ${item.color}`} />
            <div>
              <h3 className="text-sm font-medium line-clamp-1">{item.name}</h3>
              <p className="text-xs text-muted-foreground">
                {item.size} • {typeof item.items === "number" ? `${item.items} items` : item.items}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
