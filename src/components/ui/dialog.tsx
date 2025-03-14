import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Create a custom Dialog component that doesn't close on window blur
const Dialog = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> & {
    forceMount?: boolean;
    preventAutoClose?: boolean;
  }
>(({ forceMount, preventAutoClose, ...props }, ref) => {
  return (
    <DialogPrimitive.Root
      {...props}
      modal={true}
      onOpenChange={(open) => {
        // If we're preventing auto-close and something is trying to close it programmatically
        if (preventAutoClose && !open && props.open) {
          return; // Do nothing, keeping dialog open
        }
        props.onOpenChange?.(open);
      }}
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
  // Set up event listeners to prevent auto-close when tab changes
  React.useEffect(() => {
    if (!preventAutoClose) return;

    // Keep track of the dialog's open state
    let isDialogOpen = true;

    // Handle visibility and focus changes
    const handleVisibilityChange = () => {
      // Keep dialog open when tab loses focus
      if (document.visibilityState === 'hidden' || document.hidden) {
        console.log("Tab visibility changed, preventing dialog close");
        
        // Force dialog to stay open
        isDialogOpen = true;
        
        // Find all open dialogs and mark them
        const dialogElements = document.querySelectorAll('[role="dialog"]');
        dialogElements.forEach(el => {
          if (el.getAttribute('data-state') === 'open') {
            el.setAttribute('data-prevent-close', 'true');
          }
        });
      }
    };

    // More robust handling with multiple events
    const handleBlur = () => {
      console.log("Window blur event, preventing dialog close");
      handleVisibilityChange();
    };

    // Create a MutationObserver to monitor dialog state
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-state') {
          const dialogElement = mutation.target as HTMLElement;
          const newState = dialogElement.getAttribute('data-state');
          
          // If the dialog was marked to prevent close and is trying to close
          if (isDialogOpen && dialogElement.getAttribute('data-prevent-close') === 'true' && newState === 'closed') {
            // Attempt to re-open the dialog
            console.log("Dialog attempting to close while preventAutoClose is true, preventing");
            dialogElement.setAttribute('data-state', 'open');
          }
        }
      });
    });

    // Start observing all dialogs
    const dialogElements = document.querySelectorAll('[role="dialog"]');
    dialogElements.forEach(el => {
      observer.observe(el, { attributes: true });
    });

    // Prevent tab switching from closing the dialog
    window.addEventListener('blur', handleBlur);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
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
        onPointerDownOutside={preventAutoClose ? (e) => e.preventDefault() : undefined}
        onInteractOutside={preventAutoClose ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={preventAutoClose ? (e) => e.preventDefault() : undefined}
        onFocusOutside={preventAutoClose ? (e) => e.preventDefault() : undefined}
        data-prevent-autoclose={preventAutoClose ? "true" : "false"}
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
