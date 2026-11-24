// Example component test — the pattern to copy for your own components.
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { QuackList } from "@/features/quack/components/QuackList"

const mockDeleteMutate = vi.fn()
const mockAddMutateAsync = vi.fn()

vi.mock("@/features/quack/hooks/useDeleteQuack", () => ({
  useDeleteQuack: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}))

vi.mock("@/features/quack/hooks/useAddQuack", () => ({
  useAddQuack: () => ({
    mutateAsync: mockAddMutateAsync,
    isPending: false,
  }),
}))

vi.mock("@/features/quack/hooks/useToggleLike", () => ({
  useToggleLike: () => ({ mutate: vi.fn(), isPending: false }),
}))

const quack = (overrides: Partial<Quack> = {}): Quack => ({
  id: "q1",
  text: "quack quack",
  userId: "u1",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
  ...overrides,
})

describe("QuackList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders quacks with author info", () => {
    render(<QuackList quacks={[quack()]} />)

    expect(screen.getByText("quack quack")).toBeInTheDocument()
    expect(screen.getByText("Caffeinated Duck")).toBeInTheDocument()
    expect(screen.getByText("@CaffeinatedDuck")).toBeInTheDocument()
  })

  it("renders quack with mood when provided", () => {
    render(<QuackList quacks={[quack({ mood: "happy" })]} />)

    expect(screen.getByText("😊 happy")).toBeInTheDocument()
  })

  it("renders quack without mood when mood is not set", () => {
    render(<QuackList quacks={[quack({ mood: null })]} />)

    expect(screen.queryByText(/😊|😢|😡|🤪/)).not.toBeInTheDocument()
  })

  it("shows an error with a working reload button", async () => {
    const onReload = vi.fn()
    render(
      <QuackList
        quacks={[]}
        error={new Error("Server unreachable")}
        onReload={onReload}
      />,
    )

    expect(screen.getByText("Couldn't load quacks")).toBeInTheDocument()
    expect(screen.getByText("Server unreachable")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /reload/i }))
    expect(onReload).toHaveBeenCalledOnce()
  })

  it("renders custom emptyMessage when provided and quacks list is empty", () => {
    render(
      <QuackList
        quacks={[]}
        emptyMessage="No quacks found matching your search."
      />,
    )

    expect(screen.getByText("No quacks found matching your search.")).toBeInTheDocument()
  })

  it("renders Delete action for author's quacks and asks for confirmation before deleting", async () => {
    const user = userEvent.setup()
    render(
      <QuackList
        quacks={[quack({ id: "q1", userId: "u1" })]}
        currentUserId="u1"
      />,
    )

    const deleteTrigger = screen.getByRole("button", { name: /delete/i })
    expect(deleteTrigger).toBeInTheDocument()

    await user.click(deleteTrigger)

    // Confirmation dialog appears
    expect(screen.getByText("Delete quack")).toBeInTheDocument()
    expect(
      screen.getByText("Are you sure you want to delete this quack? This action cannot be undone."),
    ).toBeInTheDocument()

    // Find confirm button inside dialog and click it
    const dialog = screen.getByRole("dialog")
    const confirmButton = within(dialog).getByRole("button", { name: "Delete" })
    await user.click(confirmButton)

    expect(mockDeleteMutate).toHaveBeenCalledWith("q1", expect.any(Object))
  })

  it("does not render Delete action for quacks by other users when not admin", () => {
    render(
      <QuackList
        quacks={[quack({ id: "q1", userId: "u1" })]}
        currentUserId="other-user"
        isAdmin={false}
      />,
    )

    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument()
  })

  it("renders Delete action for quacks by other users when user is admin", () => {
    render(
      <QuackList
        quacks={[quack({ id: "q1", userId: "u1" })]}
        currentUserId="other-user"
        isAdmin={true}
      />,
    )

    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument()
  })

  it("renders emptyAction when provided", () => {
    render(
      <QuackList
        quacks={[]}
        emptyMessage="You don't have any quacks yet."
        emptyAction={<button type="button">Write the first one</button>}
      />,
    )

    expect(screen.getByText("You don't have any quacks yet.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Write the first one" })).toBeInTheDocument()
  })

  it("renders replies under a quack", () => {
    const parentWithReply = quack({
      id: "q-parent",
      text: "parent quack",
      replies: [
        quack({
          id: "q-child",
          text: "child reply",
          userId: "u2",
          user: { id: "u2", name: "Bread Critic", username: "BreadCritic" },
        }),
      ],
    })

    render(<QuackList quacks={[parentWithReply]} />)

    expect(screen.getByText("parent quack")).toBeInTheDocument()
    expect(screen.getByText("child reply")).toBeInTheDocument()
    expect(screen.getByText("Bread Critic")).toBeInTheDocument()
    expect(screen.getByText("@BreadCritic")).toBeInTheDocument()
  })

  it("renders a tombstone when quack is deleted but has replies", () => {
    const deletedWithReply = quack({
      id: "q-deleted",
      text: "",
      deletedAt: new Date("2026-01-02T12:00:00Z"),
      replies: [
        quack({
          id: "q-reply",
          text: "reply under deleted quack",
          userId: "u2",
          user: { id: "u2", name: "Bread Critic", username: "BreadCritic" },
        }),
      ],
    })

    render(<QuackList quacks={[deletedWithReply]} />)

    expect(screen.getByText("[This quack has been deleted]")).toBeInTheDocument()
    expect(screen.getByText("[deleted]")).toBeInTheDocument()
    expect(screen.getByText("reply under deleted quack")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument()
  })

  it("allows user to reply to a quack", async () => {
    const user = userEvent.setup()
    render(
      <QuackList
        quacks={[quack({ id: "q1", text: "original post" })]}
        currentUserId="u2"
      />,
    )

    const replyButton = screen.getByRole("button", { name: /reply/i })
    await user.click(replyButton)

    const input = screen.getByLabelText(/reply to @caffeinatedduck/i)
    expect(input).toBeInTheDocument()

    await user.type(input, "my test reply")
    const submitButton = screen.getByRole("button", { name: "Reply" })
    await user.click(submitButton)

    expect(mockAddMutateAsync).toHaveBeenCalledWith({
      text: "my test reply",
      replyToId: "q1",
    })
  })
})
