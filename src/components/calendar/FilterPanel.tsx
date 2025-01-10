import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client } from "../types/client";

interface FilterPanelProps {
  clients: Client[];
  designers: any[];
  selectedClient: string | null;
  selectedDesigner: string | null;
  selectedStatus: string | null;
  onClientChange: (value: string | null) => void;
  onDesignerChange: (value: string | null) => void;
  onStatusChange: (value: string | null) => void;
}

export const FilterPanel = ({
  clients,
  designers,
  selectedClient,
  selectedDesigner,
  selectedStatus,
  onClientChange,
  onDesignerChange,
  onStatusChange,
}: FilterPanelProps) => {
  return (
    <div className="w-64 space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="space-y-2">
        <Label>Cliente</Label>
        <Select value={selectedClient || "all"} onValueChange={(value) => onClientChange(value === "all" ? null : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos los clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Diseñador</Label>
        <Select value={selectedDesigner || "all"} onValueChange={(value) => onDesignerChange(value === "all" ? null : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos los diseñadores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los diseñadores</SelectItem>
            {designers.map((designer) => (
              <SelectItem key={designer.id} value={designer.name}>
                {designer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Estado</Label>
        <Select value={selectedStatus || "all"} onValueChange={(value) => onStatusChange(value === "all" ? null : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="needs_recording">Falta grabar</SelectItem>
            <SelectItem value="needs_editing">Falta editar</SelectItem>
            <SelectItem value="in_editing">En edición</SelectItem>
            <SelectItem value="in_review">En revisión</SelectItem>
            <SelectItem value="approved">Aprobado</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};