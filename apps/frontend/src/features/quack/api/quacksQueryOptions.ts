import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

import { quackKeys } from "@/features/quack/api/quackKeys"
import { quacksSchema } from "@/features/quack/api/quackSchemas"

export const quacksQueryOptions = (q?: string) =>
  queryOptions({
    // Include q in the key so React Query re-fetches whenever the search term changes.
    queryKey: [...quackKeys.lists(), { q: q ?? "" }],
    queryFn: async () =>
      quacksSchema.parse(
        await api
          .get("quacks", {
            searchParams: q?.trim() ? { q: q.trim() } : undefined,
          })
          .json(),
      ),
    // Search results should always come from the backend, never from cache.
    staleTime: 0,
  })
