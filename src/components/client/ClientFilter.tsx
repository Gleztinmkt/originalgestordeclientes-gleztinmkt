import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientFilterProps {
  onFilterChange: (day: string) => void;
}

export const ClientFilter = ({ onFilterChange }: ClientFilterProps) => {
  return (
    <Select onValueChange={onFilterChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filtrar por día de pago" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Todos los días</SelectItem>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
          <SelectItem key={day} value={day.toString()}>
            Día {day}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};