import type { Quack } from "@/features/quack/api/quackSchemas"

/**
 * Returns the feed with `quackId` (a quack or a nested reply) liked or
 * unliked: `likedByMe` set and `likeCount` moved by one (cases.md, F3).
 * Quacks that don't change keep their identity; if the state already
 * matches, nothing changes.
 */
export function applyLike(quacks: Quack[], quackId: string, isLiked: boolean): Quack[] {
  let hasChanged = false

  const visit = (quack: Quack): Quack => {
    if (quack.id === quackId) {
      if (Boolean(quack.likedByMe) === isLiked) return quack
      hasChanged = true
      const count = quack.likeCount ?? 0
      return {
        ...quack,
        likedByMe: isLiked,
        likeCount: isLiked ? count + 1 : Math.max(0, count - 1),
      }
    }
    if (!quack.replies?.length) return quack
    const replies = quack.replies.map(visit)
    return replies.some((reply, i) => reply !== quack.replies?.[i]) ? { ...quack, replies } : quack
  }

  const result = quacks.map(visit)
  return hasChanged ? result : quacks
}
