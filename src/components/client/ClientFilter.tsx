
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
      <SelectContent className="max-h-[300px] w-[var(--radix-select-trigger-width)]">
        <ScrollArea className="h-[290px] py-1">
          <SelectItem value="all">Todos los días</SelectItem>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <SelectItem key={day} value={day.toString()}>
              Día {day}
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};
