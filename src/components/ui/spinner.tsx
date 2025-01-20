import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div
        className={cn(
          "h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent",
          className
        )}
      />
    </div>
  );
}