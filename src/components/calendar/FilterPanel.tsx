import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client } from "../types/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Edit, 
  CheckCircle2, 
  Upload, 
  User,
  AlertCircle,
  Clock,
  Check
} from "lucide-react";

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
    <div className="w-64 h-full space-y-6 p-4 bg-white dark:bg-gray-800 border-r dark:border-gray-700">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Cliente</Label>
          <Select value={selectedClient || "all"} onValueChange={(value) => onClientChange(value === "all" ? null : value)}>
            <SelectTrigger className="w-full">
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
          <Label className="text-sm font-medium">Diseñador</Label>
          <Select value={selectedDesigner || "all"} onValueChange={(value) => onDesignerChange(value === "all" ? null : value)}>
            <SelectTrigger className="w-full">
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
          <Label className="text-sm font-medium">Estado</Label>
          <Select value={selectedStatus || "all"} onValueChange={(value) => onStatusChange(value === "all" ? null : value)}>
            <SelectTrigger className="w-full">
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

      <div className="space-y-2">
        <Label className="text-sm font-medium">Leyenda de estados</Label>
        <ScrollArea className="h-[200px] w-full rounded-md border p-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-orange-500" />
              <span className="text-sm">Falta grabar</span>
            </div>
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Falta editar</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm">En edición</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">En revisión</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Aprobado</span>
            </div>
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-emerald-500" />
              <span className="text-sm">Publicado</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Diseñador asignado</span>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};