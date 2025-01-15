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
      <Select value={selectedClient || ""} onValueChange={(value) => onClientChange(value || null)}>
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos los clientes</SelectItem>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Select value={selectedDesigner || ""} onValueChange={(value) => onDesignerChange(value || null)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Filtrar por diseñador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los diseñadores</SelectItem>
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

      <Select value={selectedStatus || ""} onValueChange={(value) => onStatusChange(value || null)}>
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos los estados</SelectItem>
          <SelectItem value="needs_recording">Necesita grabación</SelectItem>
          <SelectItem value="needs_editing">Necesita edición</SelectItem>
          <SelectItem value="in_editing">En edición</SelectItem>
          <SelectItem value="in_review">En revisión</SelectItem>
          <SelectItem value="approved">Aprobado</SelectItem>
          <SelectItem value="published">Publicado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedType || ""} onValueChange={(value) => onTypeChange(value || null)}>
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos los tipos</SelectItem>
          <SelectItem value="reel">Reel</SelectItem>
          <SelectItem value="carousel">Carrusel</SelectItem>
          <SelectItem value="image">Imagen</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedPackage || ""} onValueChange={(value) => onPackageChange(value || null)}>
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por paquete" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos los paquetes</SelectItem>
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