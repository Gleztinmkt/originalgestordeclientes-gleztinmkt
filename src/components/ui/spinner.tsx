import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div className="flex justify-center items-center w-full h-full min-h-[100px]">
      <Loader2 className={cn("h-8 w-8 animate-spin", className)} />
    </div>
  );
}