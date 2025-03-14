
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
  // Use a ref to track if the dialog was open before blur
  const wasOpenRef = React.useRef(props.open);
  
  React.useEffect(() => {
    wasOpenRef.current = props.open;
  }, [props.open]);

  return (
    <DialogPrimitive.Root
      {...props}
      modal={true}
      onOpenChange={(open) => {
        // If we're preventing auto-close and something is trying to close it programmatically
        if (preventAutoClose && !open && props.open) {
          console.log("Preventing dialog from closing automatically");
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
    let isFocusLost = false;

    // This flag helps us track if we're in the middle of a tab change
    let isTabChanging = false;

    // Handle visibility and focus changes
    const handleVisibilityChange = () => {
      // Keep dialog open when tab loses focus
      if (document.visibilityState === 'hidden' || document.hidden) {
        console.log("Tab visibility changed, preventing dialog close");
        
        // Mark that we're changing tabs
        isTabChanging = true;
        
        // Force dialog to stay open
        isDialogOpen = true;
        
        // Find all open dialogs and mark them
        const dialogElements = document.querySelectorAll('[role="dialog"]');
        dialogElements.forEach(el => {
          if (el.getAttribute('data-state') === 'open') {
            el.setAttribute('data-prevent-close', 'true');
          }
        });
      } else if (document.visibilityState === 'visible' && isTabChanging) {
        // We've returned to the tab
        console.log("Tab now visible again, ensuring dialog stays open");
        isTabChanging = false;
        
        // Ensure all dialogs marked to prevent close stay open
        setTimeout(() => {
          const dialogElements = document.querySelectorAll('[role="dialog"][data-prevent-close="true"]');
          dialogElements.forEach(el => {
            if (el.getAttribute('data-state') !== 'open') {
              console.log("Forcing dialog back to open state");
              el.setAttribute('data-state', 'open');
            }
          });
        }, 50); // Small delay to catch potential race conditions
      }
    };

    // More robust handling with multiple events
    const handleBlur = () => {
      console.log("Window blur event, preventing dialog close");
      isFocusLost = true;
      handleVisibilityChange();
    };

    const handleFocus = () => {
      console.log("Window regained focus");
      if (isFocusLost) {
        isFocusLost = false;
        // When focus returns, make sure our dialogs are still open
        setTimeout(() => {
          const dialogElements = document.querySelectorAll('[role="dialog"][data-prevent-close="true"]');
          dialogElements.forEach(el => {
            if (el.getAttribute('data-state') !== 'open') {
              console.log("Forcing dialog back to open state after focus return");
              el.setAttribute('data-state', 'open');
            }
          });
        }, 100); // Slightly longer delay to ensure everything has settled
      }
    };

    // Create a MutationObserver to monitor dialog state
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-state') {
          const dialogElement = mutation.target as HTMLElement;
          const newState = dialogElement.getAttribute('data-state');
          const shouldPreventClose = dialogElement.getAttribute('data-prevent-close') === 'true';
          
          // If the dialog was marked to prevent close and is trying to close
          if (isDialogOpen && shouldPreventClose && newState === 'closed') {
            // Attempt to re-open the dialog
            console.log("Dialog attempting to close while preventAutoClose is true, preventing");
            dialogElement.setAttribute('data-state', 'open');
            
            // Re-apply any classes or attributes that might have been changed
            dialogElement.classList.add('data-[state=open]:animate-in');
            dialogElement.classList.remove('data-[state=closed]:animate-out');
            
            // Dispatch a custom event to notify that we prevented a close
            const preventCloseEvent = new CustomEvent('preventedAutoClose', { 
              bubbles: true,
              detail: { element: dialogElement }
            });
            dialogElement.dispatchEvent(preventCloseEvent);
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
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodically check if our dialog should be open but isn't
    const intervalCheck = setInterval(() => {
      if (isDialogOpen && preventAutoClose) {
        const dialogElements = document.querySelectorAll('[role="dialog"][data-prevent-close="true"]');
        dialogElements.forEach(el => {
          if (el.getAttribute('data-state') !== 'open') {
            console.log("Periodic check: forcing dialog to stay open");
            el.setAttribute('data-state', 'open');
          }
        });
      }
    }, 500);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
      clearInterval(intervalCheck);
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
