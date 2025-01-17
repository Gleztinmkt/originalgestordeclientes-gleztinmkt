import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoIcon, Plus } from "lucide-react";
import { DesignerDialog } from "./DesignerDialog";
import { StatusLegend } from "./StatusLegend";
import { useState } from "react";
import { Button } from "../ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FilterPanelProps {
  clients: Array<{ id: string; name: string }>;
  designers: any[];
  selectedClient: string | null;
  selectedDesigner: string | null;
  selectedStatus: string | null;
  selectedType: string | null;
  selectedPackage: string | null;
  onClientChange: (value: string | null) => void;
  onDesignerChange: (value: string | null) => void;
  onStatusChange: (value: string | null) => void;
  onTypeChange: (value: string | null) => void;
  onPackageChange: (value: string | null) => void;
  onDesignerAdded: () => void;
  children?: React.ReactNode;
}

export const FilterPanel = ({
  clients,
  designers,
  selectedClient,
  selectedDesigner,
  selectedStatus,
  selectedType,
  selectedPackage,
  onClientChange,
  onDesignerChange,
  onStatusChange,
  onTypeChange,
  onPackageChange,
  onDesignerAdded,
  children,
}: FilterPanelProps) => {
  const [showDesignerDialog, setShowDesignerDialog] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className={`space-y-4 ${isMobile ? 'w-full' : ''}`}>
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <Select value={selectedClient || "all_clients"} onValueChange={(value) => onClientChange(value === "all_clients" ? null : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_clients">Todos los clientes</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Select value={selectedDesigner || "all_designers"} onValueChange={(value) => onDesignerChange(value === "all_designers" ? null : value)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Filtrar por diseñador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_designers">Todos los diseñadores</SelectItem>
              {designers.map((designer) => (
                <SelectItem key={designer.id} value={designer.name}>
                  {designer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDesignerDialog(true)}
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Select value={selectedStatus || "all_status"} onValueChange={(value) => onStatusChange(value === "all_status" ? null : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_status">Todos los estados</SelectItem>
              <SelectItem value="needs_recording">Falta grabar</SelectItem>
              <SelectItem value="needs_editing">Falta editar</SelectItem>
              <SelectItem value="in_editing">En edición</SelectItem>
              <SelectItem value="in_review">En revisión</SelectItem>
              <SelectItem value="approved">Aprobado</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Select value={selectedType || "all_types"} onValueChange={(value) => onTypeChange(value === "all_types" ? null : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_types">Todos los tipos</SelectItem>
              <SelectItem value="reel">Reel</SelectItem>
              <SelectItem value="carousel">Carrusel</SelectItem>
              <SelectItem value="image">Imagen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <InfoIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <StatusLegend />
              {children}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <DesignerDialog
        open={showDesignerDialog}
        onOpenChange={setShowDesignerDialog}
        onDesignerAdded={onDesignerAdded}
        onDesignerDeleted={onDesignerAdded}
      />
    </div>
  );
};