import type { ReactElement } from "react"
import { Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type LikeButtonProps = {
  likeCount: number
  likedByMe: boolean
  onToggle: (liked: boolean) => void
}

// cases.md, F1–F2: pressed when I like it, shows the count to everyone.
export function LikeButton({ likeCount, onToggle, ...props }: LikeButtonProps): ReactElement {
  const isLiked = props.likedByMe
  const action = isLiked ? "Unlike" : "Like"
  const countLabel = `${likeCount} ${likeCount === 1 ? "like" : "likes"}`

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 px-2 text-xs hover:text-foreground",
        isLiked ? "text-foreground" : "text-muted-foreground",
      )}
      aria-pressed={isLiked}
      aria-label={`${action} (${countLabel})`}
      onClick={() => onToggle(!isLiked)}
    >
      <Heart
        className={cn("size-3.5", isLiked && "fill-current")}
        aria-hidden="true"
      />
      <span>{likeCount}</span>
    </Button>
  )
}
