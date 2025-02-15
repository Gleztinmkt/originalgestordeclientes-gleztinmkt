
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DesignerSelectProps {
  value: string;
  onChange: (value: string) => void;
  designers: any[];
  disabled?: boolean;
}

export const DesignerSelect = ({ value, onChange, designers, disabled }: DesignerSelectProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm sm:text-base">Diseñador asignado</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="text-sm sm:text-base">
          <SelectValue placeholder="Seleccionar diseñador" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no_designer">Sin diseñador</SelectItem>
          {designers.map(d => (
            <SelectItem key={d.id} value={d.name}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
