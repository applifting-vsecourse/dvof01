// cases.md, F3–F4: optimistic update, rollback and a toast on failure.
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { likeQuack, unlikeQuack } from "@/features/quack/api/likeQuack"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { LikeSummary, Quack } from "@/features/quack/api/quackSchemas"
import { useToggleLike } from "@/features/quack/hooks/useToggleLike"

vi.mock("@/features/quack/api/likeQuack", () => ({
  likeQuack: vi.fn(),
  unlikeQuack: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const listKey = [...quackKeys.lists(), { q: "", isMine: false }]

const feed = (): Quack[] => [
  {
    id: "q1",
    text: "quack quack",
    userId: "u1",
    createdAt: new Date("2026-01-01T12:00:00Z"),
    user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
    likeCount: 2,
    likedByMe: false,
    replies: [],
  },
]

const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  queryClient.setQueryData(listKey, feed())
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useToggleLike(), { wrapper })
  return { queryClient, result }
}

describe("useToggleLike", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("F3: likes through the API and shows the like in the feed straight away", async () => {
    let resolve!: (value: LikeSummary) => void
    vi.mocked(likeQuack).mockReturnValue(
      new Promise<LikeSummary>((r) => {
        resolve = r
      }),
    )
    const { queryClient, result } = setup()

    act(() => {
      result.current.mutate({ quackId: "q1", liked: true })
    })

    // optimistic: visible before the server answers
    await waitFor(() =>
      expect(queryClient.getQueryData<Quack[]>(listKey)?.[0]).toMatchObject({
        likeCount: 3,
        likedByMe: true,
      }),
    )
    expect(likeQuack).toHaveBeenCalledWith("q1")
    expect(unlikeQuack).not.toHaveBeenCalled()

    resolve({ quackId: "q1", likeCount: 3, likedByMe: true })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("F3: unliking goes through the unlike API", async () => {
    vi.mocked(unlikeQuack).mockResolvedValue({ quackId: "q1", likeCount: 1, likedByMe: false })
    const { result } = setup()

    act(() => {
      result.current.mutate({ quackId: "q1", liked: false })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(unlikeQuack).toHaveBeenCalledWith("q1")
    expect(likeQuack).not.toHaveBeenCalled()
  })

  it("F4: rolls the feed back and shows an error toast when the server refuses", async () => {
    vi.mocked(likeQuack).mockRejectedValue(new Error("boom"))
    const { queryClient, result } = setup()

    act(() => {
      result.current.mutate({ quackId: "q1", liked: true })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(queryClient.getQueryData<Quack[]>(listKey)?.[0]).toMatchObject({
      likeCount: 2,
      likedByMe: false,
    })
    expect(toast.error).toHaveBeenCalled()
  })
})
