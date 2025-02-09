
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Info } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

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
  isDesigner?: boolean;
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
  isDesigner = false,
  children,
}: FilterPanelProps) => {
  const [showDesignerDialog, setShowDesignerDialog] = useState(false);
  const isMobile = useIsMobile();

  const filterContent = (
    <>
      <Select value={selectedClient || "all_clients"} onValueChange={(value) => onClientChange(value === "all_clients" ? null : value)}>
        <SelectTrigger className="min-w-[200px]">
          <SelectValue placeholder="Todos los clientes" />
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

      <div className="flex items-center gap-2">
        <Select value={selectedDesigner || "all_designers"} onValueChange={(value) => onDesignerChange(value === "all_designers" ? null : value)}>
          <SelectTrigger className="min-w-[200px]">
            <SelectValue placeholder="Todos los diseñadores" />
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
        {!isDesigner && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDesignerDialog(true)}
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Select value={selectedStatus || "all_status"} onValueChange={(value) => onStatusChange(value === "all_status" ? null : value)}>
        <SelectTrigger className="min-w-[200px]">
          <SelectValue placeholder="Todos los estados" />
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

      <Select value={selectedType || "all_types"} onValueChange={(value) => onTypeChange(value === "all_types" ? null : value)}>
        <SelectTrigger className="min-w-[200px]">
          <SelectValue placeholder="Todos los tipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all_types">Todos los tipos</SelectItem>
          <SelectItem value="reel">Reel</SelectItem>
          <SelectItem value="carousel">Carrusel</SelectItem>
          <SelectItem value="image">Imagen</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon">
            <Info className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <StatusLegend />
            {children}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );

  return (
    <div className={`${isMobile ? 'w-full' : ''}`}>
      {isMobile ? (
        <ScrollArea className="h-[calc(100vh-8rem)] px-4 pt-8">
          <div className="flex flex-col space-y-4">
            {filterContent}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex items-center gap-4">
          {filterContent}
        </div>
      )}

      {!isDesigner && (
        <DesignerDialog
          open={showDesignerDialog}
          onOpenChange={setShowDesignerDialog}
          onDesignerAdded={onDesignerAdded}
          onDesignerDeleted={onDesignerAdded}
        />
      )}
    </div>
  );
};
