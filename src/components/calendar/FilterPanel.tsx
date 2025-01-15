import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Client } from "../types/client";
import { DesignerDialog } from "./DesignerDialog";
import { useState } from "react";

interface FilterPanelProps {
  clients: Client[];
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
  children
}: FilterPanelProps) => {
  const [isDesignerDialogOpen, setIsDesignerDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
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

      <div className="flex items-center gap-2">
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
          onClick={() => setIsDesignerDialogOpen(true)}
        >
          +
        </Button>
      </div>

      <Select value={selectedStatus || "all_status"} onValueChange={(value) => onStatusChange(value === "all_status" ? null : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all_status">Todos los estados</SelectItem>
          <SelectItem value="needs_recording">Necesita grabación</SelectItem>
          <SelectItem value="needs_editing">Necesita edición</SelectItem>
          <SelectItem value="in_editing">En edición</SelectItem>
          <SelectItem value="in_review">En revisión</SelectItem>
          <SelectItem value="approved">Aprobado</SelectItem>
          <SelectItem value="published">Publicado</SelectItem>
        </SelectContent>
      </Select>

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

      <Select value={selectedPackage || "all_packages"} onValueChange={(value) => onPackageChange(value === "all_packages" ? null : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por paquete" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all_packages">Todos los paquetes</SelectItem>
          {selectedClient && clients.find(c => c.id === selectedClient)?.packages.map((pkg) => (
            <SelectItem key={pkg.id} value={pkg.id}>
              {pkg.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DesignerDialog
        open={isDesignerDialogOpen}
        onOpenChange={setIsDesignerDialogOpen}
        onDesignerAdded={onDesignerAdded}
        onDesignerDeleted={onDesignerAdded}
      />

      {children}
    </div>
  );
};