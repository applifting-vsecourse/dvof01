import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { useDeleteQuack } from "@/features/quack/hooks/useDeleteQuack"

type DeleteQuackDialogProps = {
  quackId: string
  onDelete?: (id: string) => Promise<void> | void
}

export function DeleteQuackDialog({ quackId, onDelete }: DeleteQuackDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const deleteMutation = useDeleteQuack()

  const isPending = deleteMutation.isPending

  const handleConfirmDelete = async () => {
    if (onDelete) {
      await onDelete(quackId)
      setIsOpen(false)
      return
    }

    deleteMutation.mutate(quackId, {
      onSuccess: () => {
        setIsOpen(false)
      },
    })
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
          aria-label="Delete quack"
        >
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete quack</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this quack? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
