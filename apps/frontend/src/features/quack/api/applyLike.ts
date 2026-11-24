/* eslint-disable @typescript-eslint/no-unused-vars -- stub until likes are implemented */
import type { Quack } from "@/features/quack/api/quackSchemas"

/**
 * Stub — returns the feed with `quackId` (a quack or a nested reply) liked or
 * unliked: `likedByMe` set and `likeCount` moved by one (cases.md, F3).
 */
export function applyLike(_quacks: Quack[], _quackId: string, isLiked: boolean): Quack[] {
  throw new Error("not implemented")
}
