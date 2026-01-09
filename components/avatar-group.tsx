import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AvatarGroupProps {
  avatars: string[]
  max?: number
  size?: "sm" | "md" | "lg"
}

export function AvatarGroup({ avatars, max = 3, size = "sm" }: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max)
  const remaining = avatars.length - max

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  return (
    <div className="flex items-center -space-x-2">
      {displayAvatars.map((avatar, i) => (
        <Avatar key={i} className={`${sizeClasses[size]} border-2 border-background`}>
          <AvatarImage src={avatar || "/placeholder.svg"} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeClasses[size]} flex items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground`}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
