import { Loader2, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { QuackItem } from "@/features/quack/components/QuackItem"

type QuackListProps = {
  quacks: Quack[]
  currentUserId?: string
  isAdmin?: boolean
  isLoading?: boolean
  error?: Error
  onReload?: () => void
  emptyMessage?: React.ReactNode
  emptyAction?: React.ReactNode
  onDelete?: (id: string) => Promise<void> | void
}

export function QuackList({
  quacks,
  currentUserId,
  isAdmin,
  isLoading,
  error,
  onReload,
  emptyMessage,
  emptyAction,
  onDelete,
}: QuackListProps) {
  return (
    <div className="flex flex-col">
      {isLoading && quacks.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : null}

      {error ? (
        <Alert
          variant="destructive"
          className="mb-4"
        >
          <AlertTitle>Couldn&apos;t load quacks</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error.message}</span>
            {onReload ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onReload}
              >
                <RefreshCw className="size-4" />
                Reload
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {!isLoading && !error && quacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {emptyMessage ?? "No quacks yet. Post the first one."}
          </p>
          {emptyAction}
        </div>
      ) : null}

      {quacks.map((quack) => (
        <QuackItem
          key={quack.id}
          quack={quack}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
