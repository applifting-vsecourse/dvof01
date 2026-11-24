import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query"
import { toast } from "sonner"

import { applyLike } from "@/features/quack/api/applyLike"
import { likeQuack, unlikeQuack } from "@/features/quack/api/likeQuack"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { LikeSummary, Quack } from "@/features/quack/api/quackSchemas"

export type ToggleLikeVariables = { quackId: string; liked: boolean }

type ToggleLikeContext = { previousQueries: [readonly unknown[], Quack[] | undefined][] }

// Optimistic like/unlike with rollback and an error toast (cases.md, F3–F4).
export function useToggleLike(): UseMutationResult<
  LikeSummary,
  Error,
  ToggleLikeVariables,
  ToggleLikeContext
> {
  const queryClient = useQueryClient()

  return useMutation<LikeSummary, Error, ToggleLikeVariables, ToggleLikeContext>({
    mutationFn: (variables) =>
      variables.liked ? likeQuack(variables.quackId) : unlikeQuack(variables.quackId),
    onMutate: async (variables) => {
      // Cancel outgoing refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: quackKeys.lists() })

      const previousQueries = queryClient.getQueriesData<Quack[]>({
        queryKey: quackKeys.lists(),
      })

      queryClient.setQueriesData<Quack[]>({ queryKey: quackKeys.lists() }, (old) =>
        old ? applyLike(old, variables.quackId, variables.liked) : old,
      )

      return { previousQueries }
    },
    onError: (_err, _vars, context) => {
      for (const [queryKey, data] of context?.previousQueries ?? []) {
        queryClient.setQueryData(queryKey, data)
      }
      toast.error("Failed to save your like. Please try again.")
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: quackKeys.lists() })
    },
  })
}
