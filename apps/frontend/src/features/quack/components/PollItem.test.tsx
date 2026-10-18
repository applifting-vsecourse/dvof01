import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Poll } from "@/features/quack/api/quackSchemas"
import { PollItem } from "@/features/quack/components/PollItem"

const mockMutate = vi.fn()

vi.mock("@/features/quack/hooks/useVotePoll", () => ({
  useVotePoll: () => ({
    mutate: mockMutate,
  }),
}))

const samplePoll: Poll = {
  id: "poll-1",
  totalVotes: 3,
  userVotedOptionId: "opt-1",
  options: [
    { id: "opt-1", text: "Pizza", voteCount: 2 },
    { id: "opt-2", text: "Sushi", voteCount: 1 },
    { id: "opt-3", text: "Burgers", voteCount: 0 },
  ],
}

describe("PollItem", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders poll options with percentages and vote counts", () => {
    render(<PollItem poll={samplePoll} />)

    expect(screen.getByText("Pizza")).toBeInTheDocument()
    expect(screen.getByText("Sushi")).toBeInTheDocument()
    expect(screen.getByText("Burgers")).toBeInTheDocument()

    // 2/3 = 67%, 1/3 = 33%, 0/3 = 0%
    expect(screen.getByText("67%")).toBeInTheDocument()
    expect(screen.getByText("33%")).toBeInTheDocument()
    expect(screen.getByText("0%")).toBeInTheDocument()

    expect(screen.getByText("2 votes")).toBeInTheDocument()
    expect(screen.getByText("1 vote")).toBeInTheDocument()
    expect(screen.getByText("0 votes")).toBeInTheDocument()
    expect(screen.getByText("3 votes")).toBeInTheDocument()
  })

  it("marks the voted option as pressed", () => {
    render(<PollItem poll={samplePoll} />)

    const pizzaButton = screen.getByRole("button", { name: /pizza/i })
    const sushiButton = screen.getByRole("button", { name: /sushi/i })

    expect(pizzaButton).toHaveAttribute("aria-pressed", "true")
    expect(sushiButton).toHaveAttribute("aria-pressed", "false")
  })

  it("retracts vote when clicking the currently voted option", async () => {
    render(<PollItem poll={samplePoll} />)

    const pizzaButton = screen.getByRole("button", { name: /pizza/i })
    await userEvent.click(pizzaButton)

    expect(mockMutate).toHaveBeenCalledWith({
      pollId: "poll-1",
      optionId: null,
    })
  })

  it("casts or changes vote when clicking a different option", async () => {
    render(<PollItem poll={samplePoll} />)

    const sushiButton = screen.getByRole("button", { name: /sushi/i })
    await userEvent.click(sushiButton)

    expect(mockMutate).toHaveBeenCalledWith({
      pollId: "poll-1",
      optionId: "opt-2",
    })
  })
})
