import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DeleteQuackDialog } from "@/features/quack/components/DeleteQuackDialog"

const mockMutate = vi.fn()

vi.mock("@/features/quack/hooks/useDeleteQuack", () => ({
  useDeleteQuack: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))

describe("DeleteQuackDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders trigger button and opens confirmation dialog when clicked", async () => {
    const user = userEvent.setup()
    render(<DeleteQuackDialog quackId="q-123" />)

    const trigger = screen.getByRole("button", { name: /delete quack/i })
    expect(trigger).toBeInTheDocument()

    await user.click(trigger)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Delete quack")).toBeInTheDocument()
    expect(
      screen.getByText("Are you sure you want to delete this quack? This action cannot be undone."),
    ).toBeInTheDocument()
  })

  it("closes dialog when Cancel is clicked", async () => {
    const user = userEvent.setup()
    render(<DeleteQuackDialog quackId="q-123" />)

    await user.click(screen.getByRole("button", { name: /delete quack/i }))
    const dialog = screen.getByRole("dialog")
    expect(dialog).toBeInTheDocument()

    const cancelButton = within(dialog).getByRole("button", { name: /cancel/i })
    await user.click(cancelButton)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it("calls onDelete when confirmed if onDelete callback is provided", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(
      <DeleteQuackDialog
        quackId="q-123"
        onDelete={onDelete}
      />,
    )

    await user.click(screen.getByRole("button", { name: /delete quack/i }))
    const dialog = screen.getByRole("dialog")
    const confirmButton = within(dialog).getByRole("button", { name: "Delete" })

    await user.click(confirmButton)

    expect(onDelete).toHaveBeenCalledWith("q-123")
  })
})
