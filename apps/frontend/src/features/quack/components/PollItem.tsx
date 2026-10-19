import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

import type { Poll } from "@/features/quack/api/quackSchemas"
import { useVotePoll } from "@/features/quack/hooks/useVotePoll"

type PollItemProps = {
  poll: Poll
}

export function PollItem({ poll }: PollItemProps) {
  const voteMutation = useVotePoll()

  const handleOptionClick = (optionId: string) => {
    if (poll.userVotedOptionId === optionId) {
      voteMutation.mutate({ pollId: poll.id, optionId: null })
    } else {
      voteMutation.mutate({ pollId: poll.id, optionId })
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div
        className="flex flex-col gap-1.5"
        role="group"
        aria-label="Poll options"
      >
        {poll.options.map((option) => {
          const isSelected = poll.userVotedOptionId === option.id
          const percentage =
            poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleOptionClick(option.id)}
              className={cn(
                "group relative flex w-full items-center justify-between overflow-hidden rounded-md border p-2.5 text-left text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {/* Progress bar background fill */}
              {poll.totalVotes > 0 ? (
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 -z-10 transition-all duration-300",
                    isSelected ? "bg-primary/15" : "bg-secondary",
                  )}
                  style={{ width: `${percentage}%` }}
                />
              ) : null}

              <div className="flex items-center gap-2">
                {isSelected ? (
                  <Check
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                ) : null}
                <span className="break-words">{option.text}</span>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 pl-2 text-xs text-muted-foreground">
                <span>{percentage}%</span>
                <span>·</span>
                <span>
                  {option.voteCount} {option.voteCount === 1 ? "vote" : "votes"}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
      </p>
    </div>
  )
}
