
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> & {
    forceMount?: boolean;
    preventAutoClose?: boolean;
  }
>(({ forceMount, preventAutoClose, ...props }, ref) => {
  // Interceptar y bloquear cualquier intento de cerrar cuando preventAutoClose está activo
  const handleOpenChange = React.useCallback((open: boolean) => {
    if (preventAutoClose && !open) {
      console.log('Dialog: Cierre automático bloqueado por preventAutoClose');
      return; // No ejecutar ningún cambio de estado
    }
    
    // Solo permitir cambios de estado cuando no estamos previniendo el cierre automático
    // o cuando se está abriendo el diálogo
    if (props.onOpenChange) {
      props.onOpenChange(open);
    }
  }, [preventAutoClose, props]);

  return (
    <DialogPrimitive.Root
      {...props}
      modal={true}
      onOpenChange={handleOpenChange}
    />
  );
});
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
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
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
  const handlePointerDownOutside = React.useCallback((event: Event) => {
    if (preventAutoClose) {
      event.preventDefault();
    }
  }, [preventAutoClose]);

  const handleInteractOutside = React.useCallback((event: Event) => {
    if (preventAutoClose) {
      event.preventDefault();
    }
  }, [preventAutoClose]);

  const handleEscapeKeyDown = React.useCallback((event: KeyboardEvent) => {
    if (preventAutoClose) {
      event.preventDefault();
    }
  }, [preventAutoClose]);

  // Set up event listeners to prevent auto-close when tab changes
  React.useEffect(() => {
    if (!preventAutoClose) return;

    // Create a focused flag to track focus state
    let dialogFocused = true;

    // Handler for visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        dialogFocused = false;
      } else if (document.visibilityState === 'visible' && !dialogFocused) {
        dialogFocused = true;
      }
    };

    // Handlers for window blur/focus
    const handleWindowBlur = () => {
      dialogFocused = false;
    };

    const handleWindowFocus = () => {
      dialogFocused = true;
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [preventAutoClose]);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        onPointerDownOutside={preventAutoClose ? handlePointerDownOutside : undefined}
        onInteractOutside={preventAutoClose ? handleInteractOutside : undefined}
        onEscapeKeyDown={preventAutoClose ? handleEscapeKeyDown : undefined}
        onFocusOutside={preventAutoClose ? (e) => e.preventDefault() : undefined}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
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
