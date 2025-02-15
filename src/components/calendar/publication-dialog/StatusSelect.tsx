
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const StatusSelect = ({ value, onChange }: StatusSelectProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm sm:text-base">Estado</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="text-sm sm:text-base">
          <SelectValue placeholder="Seleccionar estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="needs_recording">Falta grabar</SelectItem>
          <SelectItem value="needs_editing">Falta editar</SelectItem>
          <SelectItem value="in_editing">En edición</SelectItem>
          <SelectItem value="in_review">En revisión</SelectItem>
          <SelectItem value="approved">Aprobado</SelectItem>
          <SelectItem value="published">Publicado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
