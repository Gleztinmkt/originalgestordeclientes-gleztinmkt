
import { useState, useRef, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClientFilterProps {
  onFilterChange: (day: string) => void;
  className?: string;
}

export const ClientFilter = ({ onFilterChange, className }: ClientFilterProps) => {
  return (
    <Select onValueChange={onFilterChange}>
      <SelectTrigger className={className || "w-[200px]"}>
        <SelectValue placeholder="Filtrar por día de pago" />
      </SelectTrigger>
      <SelectContent className="max-h-[var(--radix-select-content-available-height)] overflow-hidden">
        <ScrollArea className="h-full max-h-[300px] overflow-y-auto">
          <div className="pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            <SelectItem value="all">Todos los días</SelectItem>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <SelectItem key={day} value={day.toString()}>
                Día {day}
              </SelectItem>
            ))}
          </div>
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};
