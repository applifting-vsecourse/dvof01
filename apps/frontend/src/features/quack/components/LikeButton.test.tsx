// cases.md, F1–F2
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LikeButton } from "@/features/quack/components/LikeButton"

describe("LikeButton", () => {
  it("F1: shows the count and a not-pressed Like button when I haven't liked it", () => {
    render(
      <LikeButton
        likeCount={3}
        likedByMe={false}
        onToggle={vi.fn()}
      />,
    )

    const button = screen.getByRole("button", { name: /^like/i })
    expect(button).toHaveAttribute("aria-pressed", "false")
    expect(button).toHaveTextContent("3")
  })

  it("F1: shows a pressed Unlike button when I liked it", () => {
    render(
      <LikeButton
        likeCount={1}
        likedByMe={true}
        onToggle={vi.fn()}
      />,
    )

    const button = screen.getByRole("button", { name: /^unlike/i })
    expect(button).toHaveAttribute("aria-pressed", "true")
    expect(button).toHaveTextContent("1")
  })

  it("F1: shows 0 when nobody liked it", () => {
    render(
      <LikeButton
        likeCount={0}
        likedByMe={false}
        onToggle={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: /^like/i })).toHaveTextContent("0")
  })

  it("F2: clicking Like asks to like", async () => {
    const onToggle = vi.fn()
    render(
      <LikeButton
        likeCount={0}
        likedByMe={false}
        onToggle={onToggle}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /^like/i }))

    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it("F2: clicking Unlike asks to take the like back", async () => {
    const onToggle = vi.fn()
    render(
      <LikeButton
        likeCount={1}
        likedByMe={true}
        onToggle={onToggle}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /^unlike/i }))

    expect(onToggle).toHaveBeenCalledWith(false)
  })
})
