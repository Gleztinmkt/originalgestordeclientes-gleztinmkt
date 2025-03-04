
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Info } from "lucide-react";
import { DesignerDialog } from "./DesignerDialog";
import { StatusLegend } from "./StatusLegend";
import { useState } from "react";
import { Button } from "../ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const isMobile = useIsMobile();
  
  const renderSelectContent = (items: any[], valueKey: string = 'id', labelKey: string = 'name') => (
    <SelectContent position="popper" className="max-h-[300px] w-[var(--radix-select-trigger-width)] overflow-hidden z-50 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
      <ScrollArea className="h-[290px] py-1">
        {items.map(item => (
          <SelectItem 
            key={item[valueKey]} 
            value={item[valueKey]}
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {item[labelKey]}
          </SelectItem>
        ))}
      </ScrollArea>
    </SelectContent>
  );
  
  const filterContent = <>
      <Select value={selectedClient || "all_clients"} onValueChange={value => onClientChange(value === "all_clients" ? null : value)}>
        <SelectTrigger className="min-w-[200px]">
          <SelectValue placeholder="Todos los clientes" />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-[300px] w-[var(--radix-select-trigger-width)] z-50 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
          <ScrollArea className="h-[290px] py-1">
            <SelectItem value="all_clients" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              Todos los clientes
            </SelectItem>
            {clients.map(client => (
              <SelectItem 
                key={client.id} 
                value={client.id}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {client.name}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Select value={selectedDesigner || "all_designers"} onValueChange={value => onDesignerChange(value === "all_designers" ? null : value)}>
          <SelectTrigger className="min-w-[200px]">
            <SelectValue placeholder="Todos los diseñadores" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[300px] w-[var(--radix-select-trigger-width)] z-50 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
            <ScrollArea className="h-[290px] py-1">
              <SelectItem value="all_designers" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                Todos los diseñadores
              </SelectItem>
              {designers.map(designer => (
                <SelectItem 
                  key={designer.id} 
                  value={designer.name}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {designer.name}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
        {!isDesigner && <Button variant="outline" size="icon" onClick={() => setShowDesignerDialog(true)} className="flex-shrink-0">
            <Plus className="h-4 w-4" />
          </Button>}
      </div>

      <Select value={selectedStatus || "all_status"} onValueChange={value => onStatusChange(value === "all_status" ? null : value)}>
        <SelectTrigger className="min-w-[200px]">
          <SelectValue placeholder="Todos los estados" />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-[300px] w-[var(--radix-select-trigger-width)] z-50 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
          <ScrollArea className="h-[290px] py-1">
            <SelectItem value="all_status" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              Todos los estados
            </SelectItem>
            <SelectItem value="needs_recording" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              Falta grabar
            </SelectItem>
            <SelectItem value="needs_editing" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              Falta editar
            </SelectItem>
            <SelectItem value="in_editing" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              En edición
            </SelectItem>
            <SelectItem value="in_review" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              En revisión
            </SelectItem>
            <SelectItem value="approved" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              Aprobado
            </SelectItem>
            <SelectItem value="published" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              Publicado
            </SelectItem>
          </ScrollArea>
        </SelectContent>
      </Select>

      <Select value={selectedType || "all_types"} onValueChange={value => onTypeChange(value === "all_types" ? null : value)}>
        <SelectTrigger className="min-w-[200px]">
          <SelectValue placeholder="Todos los tipos" />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-[300px] w-[var(--radix-select-trigger-width)] z-50 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
          <ScrollArea className="h-[290px] py-1">
            <SelectItem value="all_types" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              Todos los tipos
            </SelectItem>
            <SelectItem value="reel" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              Reel
            </SelectItem>
            <SelectItem value="carousel" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              Carrusel
            </SelectItem>
            <SelectItem value="image" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              Imagen
            </SelectItem>
          </ScrollArea>
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
    </>;
  return <div className={`${isMobile ? 'w-full' : ''}`}>
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
