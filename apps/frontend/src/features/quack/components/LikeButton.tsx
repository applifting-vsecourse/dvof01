 
import type { ReactElement } from "react"

type LikeButtonProps = {
  likeCount: number
  likedByMe: boolean
  onToggle: (liked: boolean) => void
}

// Stub — see cases.md, F1–F2.
export function LikeButton(_props: LikeButtonProps): ReactElement {
  throw new Error("not implemented")
}
