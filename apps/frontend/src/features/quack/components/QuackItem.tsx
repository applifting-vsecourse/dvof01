import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate } from "@/lib/date"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { UsersName } from "@/features/quack/components/UsersName"
import { UsersUserName } from "@/features/quack/components/UsersUserName"

type QuackItemProps = { quack: Quack }

const MOOD_MAP: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: "😊", label: "happy" },
  sad: { emoji: "😢", label: "sad" },
  angry: { emoji: "😡", label: "angry" },
  silly: { emoji: "🤪", label: "silly" },
}

export function QuackItem({ quack }: QuackItemProps) {
  const { name, username } = quack.user

  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const moodInfo = quack.mood ? MOOD_MAP[quack.mood] : undefined

  return (
    <article className="flex w-full gap-4 border-b border-border pt-2 pb-4 last:border-b-0">
      <Avatar className="size-12">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span>
            <UsersName name={name} /> <UsersUserName username={username} />
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <time className="text-xs text-muted-foreground">{formatDate(quack.createdAt)}</time>
          {moodInfo ? (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {moodInfo.emoji} {moodInfo.label}
              </span>
            </>
          ) : null}
        </div>
        <p className="text-sm break-words whitespace-pre-line">{quack.text}</p>
      </div>
    </article>
  )
}
