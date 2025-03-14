
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PointerIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface TaskFilterProps {
  clients: Array<{ id: string; name: string }>;
  onFilterChange: (type: string | null, clientId: string | null) => void;
}

export const TaskFilter = ({ clients = [], onFilterChange }: TaskFilterProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn("flex gap-4 mb-4", isMobile && "flex-col")}>
      <Select
        onValueChange={(value) => onFilterChange(value === "all_types" ? null : value, null)}
      >
        <SelectTrigger className={cn(
          "w-[200px] bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground",
          isMobile && "w-full h-12"
        )}>
          <SelectValue placeholder="Filtrar por categoría" />
          {isMobile && <PointerIcon className="h-4 w-4 text-muted-foreground ml-2" />}
        </SelectTrigger>
        <SelectContent className={cn(
          isMobile && "w-[calc(100vw-2rem)]"
        )} align={isMobile ? "center" : "start"}>
          <div className={cn("touch-scroll", isMobile && "py-2")}>
            <SelectItem value="all_types" className={isMobile ? "py-3" : ""}>Todas las categorías</SelectItem>
            <SelectItem value="campaña" className={isMobile ? "py-3" : ""}>Campaña</SelectItem>
            <SelectItem value="publicaciones" className={isMobile ? "py-3" : ""}>Publicaciones</SelectItem>
            <SelectItem value="correcciones" className={isMobile ? "py-3" : ""}>Correcciones</SelectItem>
            <SelectItem value="calendarios" className={isMobile ? "py-3" : ""}>Calendarios</SelectItem>
            <SelectItem value="cobros" className={isMobile ? "py-3" : ""}>Cobros</SelectItem>
            <SelectItem value="paginas web" className={isMobile ? "py-3" : ""}>Páginas Web</SelectItem>
            <SelectItem value="otros" className={isMobile ? "py-3" : ""}>Otros</SelectItem>
          </div>
        </SelectContent>
      </Select>

      <Select
        onValueChange={(value) => onFilterChange(null, value === "all_clients" ? null : value)}
      >
        <SelectTrigger className={cn(
          "w-[200px] bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground",
          isMobile && "w-full h-12"
        )}>
          <SelectValue placeholder="Filtrar por cliente" />
          {isMobile && <PointerIcon className="h-4 w-4 text-muted-foreground ml-2" />}
        </SelectTrigger>
        <SelectContent className={cn(
          isMobile && "w-[calc(100vw-2rem)]"
        )} align={isMobile ? "center" : "start"}>
          <div className={cn("touch-scroll", isMobile && "max-h-[40vh] overflow-y-auto py-2")}>
            <SelectItem value="all_clients" className={isMobile ? "py-3" : ""}>Todos los clientes</SelectItem>
            {clients.map((client) => (
              client.id ? (
                <SelectItem key={client.id} value={client.id} className={isMobile ? "py-3" : ""}>
                  {client.name || 'Cliente sin nombre'}
                </SelectItem>
              ) : null
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};
