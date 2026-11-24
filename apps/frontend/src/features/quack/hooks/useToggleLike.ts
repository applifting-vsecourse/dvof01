import type { UseMutationResult } from "@tanstack/react-query"

import type { LikeSummary } from "@/features/quack/api/quackSchemas"

export type ToggleLikeVariables = { quackId: string; liked: boolean }

// Stub — optimistic like/unlike with rollback and an error toast (cases.md, F3–F4).
export function useToggleLike(): UseMutationResult<
  LikeSummary,
  Error,
  ToggleLikeVariables,
  unknown
> {
  throw new Error("not implemented")
}
