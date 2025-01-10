import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskFilterProps {
  clients: Array<{ id: string; name: string }>;
  onFilterChange: (type: string | null, clientId: string | null) => void;
}

export const TaskFilter = ({ clients, onFilterChange }: TaskFilterProps) => {
  return (
    <div className="flex gap-4 mb-4">
      <Select
        onValueChange={(value) => onFilterChange(value === "all" ? null : value, null)}
      >
        <SelectTrigger className="w-[200px] bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground">
          <SelectValue placeholder="Filtrar por categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          <SelectItem value="campaña">Campaña</SelectItem>
          <SelectItem value="publicaciones">Publicaciones</SelectItem>
          <SelectItem value="correcciones">Correcciones</SelectItem>
          <SelectItem value="calendarios">Calendarios</SelectItem>
          <SelectItem value="cobros">Cobros</SelectItem>
          <SelectItem value="otros">Otros</SelectItem>
        </SelectContent>
      </Select>

      <Select
        onValueChange={(value) => onFilterChange(null, value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[200px] bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground">
          <SelectValue placeholder="Filtrar por cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los clientes</SelectItem>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id || "no_client"}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};