import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

import { quackKeys } from "@/features/quack/api/quackKeys"
import { quacksSchema } from "@/features/quack/api/quackSchemas"

export const quacksQueryOptions = (q?: string, isMine?: boolean) =>
  queryOptions({
    // Include q and isMine in the key so React Query re-fetches whenever either changes.
    queryKey: [...quackKeys.lists(), { q: q ?? "", isMine: Boolean(isMine) }],
    queryFn: async () => {
      const searchParams: Record<string, string> = {}
      if (q?.trim()) {
        searchParams.q = q.trim()
      }
      if (isMine) {
        searchParams.mine = "true"
      }

      return quacksSchema.parse(
        await api
          .get("quacks", {
            searchParams: Object.keys(searchParams).length > 0 ? searchParams : undefined,
          })
          .json(),
      )
    },
    // Search results should always come from the backend, never from cache.
    staleTime: 0,
  })
