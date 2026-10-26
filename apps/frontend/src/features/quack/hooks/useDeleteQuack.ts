import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteQuack } from "@/features/quack/api/deleteQuack"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Quack } from "@/features/quack/api/quackSchemas"

export function useDeleteQuack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteQuack,
    onMutate: async (deletedId: string) => {
      await queryClient.cancelQueries({ queryKey: quackKeys.all() })

      const previousQueries = queryClient.getQueriesData<Quack[]>({
        queryKey: quackKeys.lists(),
      })

      queryClient.setQueriesData<Quack[]>({ queryKey: quackKeys.lists() }, (old) =>
        old ? old.filter((q) => q.id !== deletedId) : [],
      )

      return { previousQueries }
    },
    onError: (_err, _id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: quackKeys.all() })
    },
  })
}
