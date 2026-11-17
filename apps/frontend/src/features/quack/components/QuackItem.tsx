import { useState } from "react"
import { MessageSquare } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/date"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { DeleteQuackDialog } from "@/features/quack/components/DeleteQuackDialog"
import { PollItem } from "@/features/quack/components/PollItem"
import { UsersName } from "@/features/quack/components/UsersName"
import { UsersUserName } from "@/features/quack/components/UsersUserName"
import { useAddQuack } from "@/features/quack/hooks/useAddQuack"

type QuackItemProps = {
  quack: Quack
  currentUserId?: string
  isAdmin?: boolean
  onDelete?: (id: string) => Promise<void> | void
  depth?: number
}

const MOOD_MAP: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: "😊", label: "happy" },
  sad: { emoji: "😢", label: "sad" },
  angry: { emoji: "😡", label: "angry" },
  silly: { emoji: "🤪", label: "silly" },
}

export function QuackItem({ quack, currentUserId, isAdmin, onDelete, depth = 0 }: QuackItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replyError, setReplyError] = useState<string | null>(null)
  const addQuackMutation = useAddQuack()

  if (quack.deletedAt) {
    return (
      <article className="flex w-full gap-4 border-b border-border pt-2 pb-4 last:border-b-0">
        <Avatar className="size-12 opacity-50">
          <AvatarFallback>?</AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-medium text-muted-foreground">[deleted]</span>
              <span className="text-xs text-muted-foreground">·</span>
              <time className="text-xs text-muted-foreground">{formatDate(quack.createdAt)}</time>
            </div>
          </div>
          <p className="text-sm text-muted-foreground italic">[This quack has been deleted]</p>

          {quack.replies && quack.replies.length > 0 ? (
            <div className="mt-3 flex flex-col gap-2 border-l border-border pl-4">
              {quack.replies.map((reply) => (
                <QuackItem
                  key={reply.id}
                  quack={reply}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              ))}
            </div>
          ) : null}
        </div>
      </article>
    )
  }

  const { name, username } = quack.user
  const isOwner = Boolean(currentUserId && currentUserId === quack.userId)
  const canDelete = isOwner || Boolean(isAdmin)

  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const moodInfo = quack.mood ? MOOD_MAP[quack.mood] : undefined
  const repliesCount = quack.replies?.length ?? 0

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = replyText.trim()
    if (!trimmed) {
      setReplyError("Reply cannot be empty.")
      return
    }
    if (trimmed.length > 280) {
      setReplyError("Reply cannot exceed 280 characters.")
      return
    }

    try {
      setReplyError(null)
      await addQuackMutation.mutateAsync({
        text: trimmed,
        replyToId: quack.id,
      })
      setReplyText("")
      setIsReplying(false)
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Failed to post reply.")
    }
  }

  return (
    <article className="flex w-full gap-4 border-b border-border pt-2 pb-4 last:border-b-0">
      <Avatar className="size-12">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
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
          {canDelete ? (
            <DeleteQuackDialog
              quackId={quack.id}
              onDelete={onDelete}
            />
          ) : null}
        </div>
        <p className="text-sm break-words whitespace-pre-line">{quack.text}</p>
        {quack.poll ? <PollItem poll={quack.poll} /> : null}

        <div className="mt-1 flex items-center gap-4">
          {currentUserId ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setIsReplying((prev) => !prev)}
              aria-label={`Reply to ${username}`}
            >
              <MessageSquare className="mr-1.5 size-3.5" />
              <span>Reply</span>
              {repliesCount > 0 ? (
                <span className="ml-1 text-muted-foreground">({repliesCount})</span>
              ) : null}
            </Button>
          ) : null}
        </div>

        {isReplying ? (
          <form
            onSubmit={handleReplySubmit}
            className="mt-2 flex flex-col gap-2 border-t border-border pt-2"
          >
            <label
              htmlFor={`reply-input-${quack.id}`}
              className="text-xs font-medium text-muted-foreground"
            >
              Reply to @{username}
            </label>
            <Textarea
              id={`reply-input-${quack.id}`}
              value={replyText}
              onChange={(e) => {
                setReplyText(e.target.value)
                if (replyError) setReplyError(null)
              }}
              placeholder="Write your reply..."
              rows={2}
              className="min-h-16 text-sm"
              maxLength={280}
            />
            {replyError ? <p className="text-xs text-destructive">{replyError}</p> : null}
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsReplying(false)
                  setReplyText("")
                  setReplyError(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={addQuackMutation.isPending}
              >
                {addQuackMutation.isPending ? "Replying..." : "Reply"}
              </Button>
            </div>
          </form>
        ) : null}

        {quack.replies && quack.replies.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2 border-l border-border pl-4">
            {quack.replies.map((reply) => (
              <QuackItem
                key={reply.id}
                quack={reply}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onDelete={onDelete}
                depth={depth + 1}
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
