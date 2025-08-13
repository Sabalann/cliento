import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DialogClose } from "@radix-ui/react-dialog"


type ConfirmDialogProps = {
  triggerLabel: string
  title: string
  description?: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
  confirmClassName?: string
  triggerClassName?: string
}

export function ConfirmDialog({ triggerLabel, title, description, confirmLabel, onConfirm, confirmClassName, triggerClassName }: ConfirmDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" className={triggerClassName}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex items-center justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="secondary">Annuleren</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" className={confirmClassName} onClick={() => onConfirm()}>
              {confirmLabel}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}