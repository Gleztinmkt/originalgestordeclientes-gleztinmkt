import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Standard shadcn Dialog with optional `preventAutoClose`.
// When preventAutoClose is set, ANY onOpenChange(false) coming from Radix
// (focus loss, tab switch, escape, outside click, browser blur, etc.) is
// IGNORED. The dialog can only close when an explicit close action is taken
// (the Close button, or programmatic onOpenChange via Cerrar/Guardar/Eliminar
// in the parent — those parents call onOpenChange themselves, bypassing this
// guard, since they call the prop they received, not Radix internals).
const Dialog = ({
  preventAutoClose,
  onOpenChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> & {
  preventAutoClose?: boolean;
}) => {
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (preventAutoClose && !next) {
        // Block every automatic close attempt. Parent must close via its own logic.
        return;
      }
      onOpenChange?.(next);
    },
    [preventAutoClose, onOpenChange],
  );
  return (
    <DialogPrimitive.Root
      {...props}
      modal={props.modal ?? true}
      onOpenChange={handleOpenChange}
    />
  );
};
Dialog.displayName = "Dialog";

const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    preventAutoClose?: boolean;
  }
>(({ className, children, preventAutoClose, ...props }, ref) => {
  // When preventAutoClose is true, we block ALL automatic close paths so the
  // dialog can only be closed by an explicit user action (close button, save,
  // delete, etc). This includes:
  //  - clicking outside (pointerDownOutside / interactOutside)
  //  - pressing Escape (escapeKeyDown)
  //  - focus moving outside the dialog because the user switched browser tab
  //    or another window stole focus (focusOutside / window blur)
  const userHandlers = {
    onPointerDownOutside: props.onPointerDownOutside,
    onInteractOutside: props.onInteractOutside,
    onEscapeKeyDown: props.onEscapeKeyDown,
    onFocusOutside: props.onFocusOutside,
  };
  const {
    onPointerDownOutside: _a,
    onInteractOutside: _b,
    onEscapeKeyDown: _c,
    onFocusOutside: _d,
    ...restProps
  } = props;

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto",
          className
        )}
        {...restProps}
        onPointerDownOutside={(e) => {
          if (preventAutoClose) e.preventDefault();
          userHandlers.onPointerDownOutside?.(e);
        }}
        onInteractOutside={(e) => {
          if (preventAutoClose) e.preventDefault();
          userHandlers.onInteractOutside?.(e);
        }}
        onEscapeKeyDown={(e) => {
          if (preventAutoClose) e.preventDefault();
          userHandlers.onEscapeKeyDown?.(e);
        }}
        onFocusOutside={(e) => {
          if (preventAutoClose) e.preventDefault();
          userHandlers.onFocusOutside?.(e);
        }}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
