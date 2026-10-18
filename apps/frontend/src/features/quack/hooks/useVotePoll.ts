import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Quack } from "@/features/quack/api/quackSchemas"
import { retractVotePoll, votePoll } from "@/features/quack/api/votePoll"

type VoteMutationVariables = {
  pollId: string
  optionId: string | null // null means retract vote
}

export function useVotePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pollId, optionId }: VoteMutationVariables) => {
      if (optionId === null) {
        return retractVotePoll({ pollId })
      }
      return votePoll({ pollId, optionId })
    },
    onMutate: async ({ pollId, optionId }) => {
      // Cancel outgoing queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: quackKeys.lists() })

      // Snapshot previous query data for rollback on failure
      const previousQueries = queryClient.getQueriesData<Quack[]>({
        queryKey: quackKeys.lists(),
      })

      // Optimistically update quack feed cache
      queryClient.setQueriesData<Quack[]>({ queryKey: quackKeys.lists() }, (old) => {
        if (!old) return old
        return old.map((quack) => {
          if (quack.poll?.id !== pollId) return quack

          const oldVotedOptionId = quack.poll.userVotedOptionId
          const newVotedOptionId = optionId

          const updatedOptions = quack.poll.options.map((opt) => {
            let count = opt.voteCount
            if (oldVotedOptionId === opt.id) {
              count = Math.max(0, count - 1)
            }
            if (newVotedOptionId === opt.id) {
              count += 1
            }
            return { ...opt, voteCount: count }
          })

          let totalVotes = quack.poll.totalVotes
          if (oldVotedOptionId && !newVotedOptionId) {
            totalVotes = Math.max(0, totalVotes - 1)
          } else if (!oldVotedOptionId && newVotedOptionId) {
            totalVotes += 1
          }

          return {
            ...quack,
            poll: {
              ...quack.poll,
              options: updatedOptions,
              totalVotes,
              userVotedOptionId: newVotedOptionId,
            },
          }
        })
      })

      return { previousQueries }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data)
        }
      }
      toast.error("Failed to save your vote. Please try again.")
    },
    onSuccess: (updatedPoll) => {
      queryClient.setQueriesData<Quack[]>({ queryKey: quackKeys.lists() }, (old) => {
        if (!old) return old
        return old.map((quack) => {
          if (quack.poll?.id === updatedPoll.id) {
            return {
              ...quack,
              poll: updatedPoll,
            }
          }
          return quack
        })
      })
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: quackKeys.lists() })
    },
  })
}
