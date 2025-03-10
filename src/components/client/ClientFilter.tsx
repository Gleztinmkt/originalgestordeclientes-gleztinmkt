
import { useState, useCallback, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface ClientFilterProps {
  onFilterChange: (day: string) => void;
  className?: string;
}

export const ClientFilter = ({ onFilterChange, className }: ClientFilterProps) => {
  const isMobile = useIsMobile();
  
  // Optimize with memoization
  const daysArray = useMemo(() => 
    Array.from({ length: 31 }, (_, i) => i + 1), 
  []);
  
  // Optimize the change handler
  const handleValueChange = useCallback((value: string) => {
    onFilterChange(value);
  }, [onFilterChange]);
  
  return (
    <Select onValueChange={handleValueChange}>
      <SelectTrigger className={className || "w-[200px]"}>
        <SelectValue placeholder="Filtrar por día de pago" />
      </SelectTrigger>
      <SelectContent className="max-h-[400px] touch-scroll">
        <div className="touch-scroll" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          <SelectItem value="all">Todos los días</SelectItem>
          {daysArray.map((day) => (
            <SelectItem key={day} value={day.toString()}>
              Día {day}
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
};
