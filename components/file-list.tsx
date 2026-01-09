import { ChevronRight, Plus, Grid2X2, MoreHorizontal, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const files = [
  { name: "Docs", type: "folder", sharing: "Public", size: "4.5 MB", modified: "Apr 10, 2022" },
  { name: "Fonts", type: "folder", sharing: "Public", size: "2.5 MB", modified: "Apr 2, 2022" },
  {
    name: "Source",
    type: "folder",
    sharing: [
      "/placeholder.svg?height=32&width=32",
      "/placeholder.svg?height=32&width=32",
      "/placeholder.svg?height=32&width=32",
    ],
    size: "1.2 MB",
    modified: "Yesterday",
    highlighted: true,
  },
  {
    name: "Example",
    type: "folder",
    sharing: [
      "/placeholder.svg?height=32&width=32",
      "/placeholder.svg?height=32&width=32",
      "/placeholder.svg?height=32&width=32",
    ],
    size: "12.2 MB",
    modified: "Yesterday",
  },
  { name: "OFL.txt", type: "document", sharing: "Public", size: "4 KB", modified: "Oct 12, 2021" },
  { name: "Readme.md", type: "file", sharing: "Public", size: "2 KB", modified: "Oct 12, 2021" },
  { name: "index.html", type: "code", sharing: "Public", size: "14 KB", modified: "Oct 12, 2021" },
]

export function FileList() {
  return (
    <Card className="border-border bg-card p-6">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Home</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Concept Font</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Maszeh</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border">
            <tr className="text-left text-sm text-muted-foreground">
              <th className="pb-3 font-medium">
                <div className="flex items-center gap-1">
                  Name
                  <ChevronDown className="h-4 w-4" />
                </div>
              </th>
              <th className="pb-3 font-medium">Sharing</th>
              <th className="pb-3 font-medium">
                <div className="flex items-center gap-1">
                  Size
                  <ChevronDown className="h-4 w-4" />
                </div>
              </th>
              <th className="pb-3 font-medium">
                <div className="flex items-center gap-1">
                  Modified
                  <ChevronDown className="h-4 w-4" />
                </div>
              </th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, i) => (
              <tr
                key={i}
                className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${
                  file.highlighted ? "bg-primary/5" : ""
                }`}
              >
                <td className="py-3">
                  <span className="font-medium text-sm">{file.name}</span>
                </td>
                <td className="py-3">
                  <span className="text-sm text-muted-foreground">
                    {typeof file.sharing === "string" ? file.sharing : "Shared"}
                  </span>
                </td>
                <td className="py-3 text-sm text-muted-foreground">{file.size}</td>
                <td className="py-3 text-sm text-muted-foreground">{file.modified}</td>
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
    </Card>
  )
}
