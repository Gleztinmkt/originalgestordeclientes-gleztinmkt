
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
        // Always prevent automatic closing behavior when preventAutoClose is true
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
  // Use a ref to store the dialog portal element
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  // This effect completely disables all automatic closing behaviors
  React.useEffect(() => {
    if (!preventAutoClose) return;

    // Function to prevent closing dialog when tab changes
    const handleVisibilityChange = (e: Event) => {
      if (preventAutoClose) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // We want to capture ALL events that might close the dialog
    window.addEventListener('visibilitychange', handleVisibilityChange, true);
    window.addEventListener('blur', handleVisibilityChange, true);
    window.addEventListener('focus', handleVisibilityChange, true);
    
    // Re-add tabindex=-1 to dialog elements to prevent focus/blur issues
    const maintainFocus = setInterval(() => {
      if (preventAutoClose && dialogRef.current) {
        const dialogElements = document.querySelectorAll('[role="dialog"]');
        dialogElements.forEach(el => {
          if (el.getAttribute('data-state') === 'open') {
            // Ensure dialog can't be closed by tab focus
            el.setAttribute('tabindex', '-1');
          }
        });
      }
    }, 100);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange, true);
      window.removeEventListener('blur', handleVisibilityChange, true);
      window.removeEventListener('focus', handleVisibilityChange, true);
      clearInterval(maintainFocus);
    };
  }, [preventAutoClose]);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={(el) => {
          // Store ref for our own use
          dialogRef.current = el;
          // Forward ref if provided
          if (typeof ref === 'function') {
            ref(el);
          } else if (ref) {
            ref.current = el;
          }
        }}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        // Completely disable all outside interactions when preventAutoClose is true
        onPointerDownOutside={preventAutoClose ? (e) => e.preventDefault() : undefined}
        onInteractOutside={preventAutoClose ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={preventAutoClose ? (e) => e.preventDefault() : undefined}
        onFocusOutside={preventAutoClose ? (e) => e.preventDefault() : undefined}
        // Add data attribute for styling
        data-prevent-autoclose={preventAutoClose ? "true" : "false"}
        // Prevent any close behavior on tab change
        onBlur={preventAutoClose ? (e) => e.preventDefault() : undefined}
        tabIndex={preventAutoClose ? -1 : undefined}
        {...props}
      >
        {children}
        {/* Only show close button if we're not preventing auto-close */}
        {!preventAutoClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
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
