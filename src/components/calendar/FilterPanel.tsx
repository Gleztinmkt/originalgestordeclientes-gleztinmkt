import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Video, Edit, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DesignerDialog } from "./DesignerDialog";
import { Client } from "../types/client";
import { StatusLegend } from "./StatusLegend";

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
  children,
}: FilterPanelProps) => {
  const [showDesignerDialog, setShowDesignerDialog] = useState(false);

  return (
    <div className="space-y-4">
      <Select value={selectedClient || ""} onValueChange={onClientChange}>
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
        <Select value={selectedDesigner || ""} onValueChange={onDesignerChange}>
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
          onClick={() => setShowDesignerDialog(true)}
        >
          +
        </Button>
      </div>

      <Select value={selectedStatus || ""} onValueChange={onStatusChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos los estados</SelectItem>
          <SelectItem value="needs_recording">Falta grabar</SelectItem>
          <SelectItem value="needs_editing">Falta editar</SelectItem>
          <SelectItem value="in_editing">En edición</SelectItem>
          <SelectItem value="in_review">En revisión</SelectItem>
          <SelectItem value="approved">Aprobado</SelectItem>
          <SelectItem value="published">Publicado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedType || ""} onValueChange={onTypeChange}>
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

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Haz clic derecho sobre una publicación para cambiar su estado
        </AlertDescription>
      </Alert>

      <StatusLegend />

      {children}

      <DesignerDialog
        open={showDesignerDialog}
        onOpenChange={setShowDesignerDialog}
        onDesignerAdded={onDesignerAdded}
        onDesignerDeleted={onDesignerAdded} // We'll reuse the same callback since both actions require a refresh
      />
    </div>
  );
};