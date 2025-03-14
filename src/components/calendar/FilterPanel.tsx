
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Info, Search, Touch } from "lucide-react";
import { DesignerDialog } from "./DesignerDialog";
import { StatusLegend } from "./StatusLegend";
import { useState } from "react";
import { Button } from "../ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  clients: Array<{
    id: string;
    name: string;
  }>;
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
  children
}: FilterPanelProps) => {
  const [showDesignerDialog, setShowDesignerDialog] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
  );

  const filterContent = (
    <>
      <Select value={selectedClient || "all_clients"} onValueChange={value => onClientChange(value === "all_clients" ? null : value)}>
        <SelectTrigger className={cn("min-w-[200px]", isMobile && "h-12")}>
          <SelectValue placeholder="Todos los clientes" />
          {isMobile && <Touch className="h-4 w-4 text-muted-foreground ml-2" />}
        </SelectTrigger>
        <SelectContent className={isMobile ? "w-[calc(100vw-2rem)]" : ""}>
          <div className="sticky top-0 bg-popover p-2 border-b z-10">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..." 
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className={cn("touch-scroll", isMobile && "max-h-[40vh] overflow-y-auto py-2")}>
            <SelectItem value="all_clients" className={isMobile ? "py-3" : ""}>Todos los clientes</SelectItem>
            {filteredClients.map(client => (
              <SelectItem key={client.id} value={client.id} className={isMobile ? "py-3" : ""}>
                {client.name}
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Select value={selectedDesigner || "all_designers"} onValueChange={value => onDesignerChange(value === "all_designers" ? null : value)}>
          <SelectTrigger className={cn("min-w-[200px]", isMobile && "h-12")}>
            <SelectValue placeholder="Todos los diseñadores" />
            {isMobile && <Touch className="h-4 w-4 text-muted-foreground ml-2" />}
          </SelectTrigger>
          <SelectContent className={isMobile ? "w-[calc(100vw-2rem)]" : ""}>
            <div className={cn("touch-scroll", isMobile && "max-h-[40vh] overflow-y-auto py-2")}>
              <SelectItem value="all_designers" className={isMobile ? "py-3" : ""}>Todos los diseñadores</SelectItem>
              {designers.map(designer => (
                <SelectItem key={designer.id} value={designer.name} className={isMobile ? "py-3" : ""}>
                  {designer.name}
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
        {!isDesigner && <Button variant="outline" size={isMobile ? "default" : "icon"} onClick={() => setShowDesignerDialog(true)} className="flex-shrink-0">
            <Plus className="h-4 w-4" />
          </Button>}
      </div>

      <Select value={selectedStatus || "all_status"} onValueChange={value => onStatusChange(value === "all_status" ? null : value)}>
        <SelectTrigger className={cn("min-w-[200px]", isMobile && "h-12")}>
          <SelectValue placeholder="Todos los estados" />
          {isMobile && <Touch className="h-4 w-4 text-muted-foreground ml-2" />}
        </SelectTrigger>
        <SelectContent className={isMobile ? "w-[calc(100vw-2rem)]" : ""}>
          <div className={cn("touch-scroll", isMobile && "py-2")}>
            <SelectItem value="all_status" className={isMobile ? "py-3" : ""}>Todos los estados</SelectItem>
            <SelectItem value="needs_recording" className={isMobile ? "py-3" : ""}>Falta grabar</SelectItem>
            <SelectItem value="needs_editing" className={isMobile ? "py-3" : ""}>Falta editar</SelectItem>
            <SelectItem value="in_editing" className={isMobile ? "py-3" : ""}>En edición</SelectItem>
            <SelectItem value="in_review" className={isMobile ? "py-3" : ""}>En revisión</SelectItem>
            <SelectItem value="approved" className={isMobile ? "py-3" : ""}>Aprobado</SelectItem>
            <SelectItem value="published" className={isMobile ? "py-3" : ""}>Publicado</SelectItem>
          </div>
        </SelectContent>
      </Select>

      <Select value={selectedType || "all_types"} onValueChange={value => onTypeChange(value === "all_types" ? null : value)}>
        <SelectTrigger className={cn("min-w-[200px]", isMobile && "h-12")}>
          <SelectValue placeholder="Todos los tipos" />
          {isMobile && <Touch className="h-4 w-4 text-muted-foreground ml-2" />}
        </SelectTrigger>
        <SelectContent className={isMobile ? "w-[calc(100vw-2rem)]" : ""}>
          <div className={cn("touch-scroll", isMobile && "py-2")}>
            <SelectItem value="all_types" className={isMobile ? "py-3" : ""}>Todos los tipos</SelectItem>
            <SelectItem value="reel" className={isMobile ? "py-3" : ""}>Reel</SelectItem>
            <SelectItem value="carousel" className={isMobile ? "py-3" : ""}>Carrusel</SelectItem>
            <SelectItem value="image" className={isMobile ? "py-3" : ""}>Imagen</SelectItem>
          </div>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size={isMobile ? "default" : "icon"} className={isMobile ? "h-12 w-12" : ""}>
            <Info className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-80", isMobile && "w-[calc(100vw-2rem)]")}>
          <div className="space-y-4">
            <StatusLegend />
            {children}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
  
  return <div className={cn(isMobile ? 'w-full' : '')}>
      {isMobile ? (
        <div className="h-[calc(100vh-8rem)] px-4 pt-8 overflow-y-auto">
          <div className="flex flex-col space-y-4 py-[42px]">
            {filterContent}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {filterContent}
        </div>
      )}

      {!isDesigner && <DesignerDialog open={showDesignerDialog} onOpenChange={setShowDesignerDialog} onDesignerAdded={onDesignerAdded} onDesignerDeleted={onDesignerAdded} />}
    </div>;
};
