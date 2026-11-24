// cases.md, F5 (and the wiring of F2): the like button inside a quack.
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { QuackItem } from "@/features/quack/components/QuackItem"

const mockToggleLike = vi.fn()

vi.mock("@/features/quack/hooks/useToggleLike", () => ({
  useToggleLike: () => ({ mutate: mockToggleLike, isPending: false }),
}))

vi.mock("@/features/quack/hooks/useAddQuack", () => ({
  useAddQuack: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock("@/features/quack/hooks/useDeleteQuack", () => ({
  useDeleteQuack: () => ({ mutate: vi.fn(), isPending: false }),
}))

const quack = (overrides: Partial<Quack> = {}): Quack => ({
  id: "q1",
  text: "quack quack",
  userId: "u1",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
  likeCount: 4,
  likedByMe: false,
  ...overrides,
})

describe("QuackItem likes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("F5: a quack shows its like button with the count", () => {
    render(
      <QuackItem
        quack={quack()}
        currentUserId="u2"
      />,
    )

    expect(screen.getByRole("button", { name: /^like/i })).toHaveTextContent("4")
  })

  it("F2: clicking the like button likes this quack", async () => {
    render(
      <QuackItem
        quack={quack()}
        currentUserId="u2"
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /^like/i }))

    expect(mockToggleLike).toHaveBeenCalledWith({ quackId: "q1", liked: true })
  })

  it("F5: a deleted quack (tombstone) has no like button, its replies do", () => {
    render(
      <QuackItem
        quack={quack({
          text: "",
          deletedAt: new Date("2026-01-02T12:00:00Z"),
          likeCount: 0,
          replies: [quack({ id: "r1", text: "a reply", replyToId: "q1", likeCount: 1 })],
        })}
        currentUserId="u2"
      />,
    )

    const buttons = screen.getAllByRole("button", { name: /^like/i })
    expect(buttons).toHaveLength(1)
    const reply = screen.getByText("a reply").closest("article")
    expect(reply).not.toBeNull()
    expect(within(reply!).getByRole("button", { name: /^like/i })).toHaveTextContent("1")
  })
})
