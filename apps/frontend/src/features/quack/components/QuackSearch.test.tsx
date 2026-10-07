import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { QuackSearch } from "@/features/quack/components/QuackSearch"

describe("QuackSearch", () => {
  it("renders search input with label", () => {
    render(
      <QuackSearch
        value=""
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText("Search quacks")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Search quacks...")).toBeInTheDocument()
  })

  it("calls onChange when typing", async () => {
    const onChange = vi.fn()
    render(
      <QuackSearch
        value=""
        onChange={onChange}
      />,
    )

    const input = screen.getByLabelText("Search quacks")
    await userEvent.type(input, "crumb")

    expect(onChange).toHaveBeenCalled()
  })

  it("shows clear button when value is non-empty and clears on click", async () => {
    const onChange = vi.fn()
    render(
      <QuackSearch
        value="crumb"
        onChange={onChange}
      />,
    )

    const clearButton = screen.getByRole("button", { name: "Clear search" })
    expect(clearButton).toBeInTheDocument()

    await userEvent.click(clearButton)
    expect(onChange).toHaveBeenCalledWith("")
  })
})
