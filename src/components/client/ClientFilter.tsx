
import { useState, useRef, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Touch } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientFilterProps {
  onFilterChange: (day: string) => void;
  className?: string;
}

export const ClientFilter = ({ onFilterChange, className }: ClientFilterProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={cn("relative", isMobile && "w-full")}>
      <Select 
        onValueChange={onFilterChange} 
        onOpenChange={(open) => setIsOpen(open)}
      >
        <SelectTrigger 
          className={cn(
            className || "w-[200px]",
            isMobile && "w-full",
            isOpen && "ring-2 ring-primary"
          )}
        >
          <SelectValue placeholder="Filtrar por día de pago" />
          {isMobile && (
            <Touch className="h-4 w-4 text-muted-foreground ml-2" />
          )}
        </SelectTrigger>
        <SelectContent 
          className={cn(
            "max-h-[400px]",
            isMobile && "w-[calc(100vw-2rem)]"
          )}
          align={isMobile ? "center" : "start"}
          sideOffset={isMobile ? 5 : 4}
        >
          <div className={cn(
            "touch-scroll",
            isMobile && "py-2"
          )}>
            <SelectItem value="all" className={isMobile ? "py-3" : ""}>Todos los días</SelectItem>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <SelectItem 
                key={day} 
                value={day.toString()}
                className={isMobile ? "py-3" : ""}
              >
                Día {day}
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};
