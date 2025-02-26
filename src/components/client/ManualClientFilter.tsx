
import { useState } from "react";
import { Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Client } from "../types/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface ManualClientFilterProps {
  clients: Client[];
  selectedClientIds: string[];
  onSelectedClientsChange: (selectedIds: string[]) => void;
  className?: string;
}

export const ManualClientFilter = ({
  clients,
  selectedClientIds,
  onSelectedClientsChange,
  className,
}: ManualClientFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const handleSelectAll = () => {
    onSelectedClientsChange(clients.map(client => client.id));
  };

  const handleDeselectAll = () => {
    onSelectedClientsChange([]);
  };

  const handleClientToggle = (clientId: string) => {
    if (selectedClientIds.includes(clientId)) {
      onSelectedClientsChange(selectedClientIds.filter(id => id !== clientId));
    } else {
      onSelectedClientsChange([...selectedClientIds, clientId]);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clientList = (
    <div className="space-y-2">
      <div className="sticky top-0 bg-background z-10 p-2 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={handleSelectAll}
          >
            <Check className="h-4 w-4 mr-1" />
            Seleccionar todos
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={handleDeselectAll}
          >
            <X className="h-4 w-4 mr-1" />
            Deseleccionar todos
          </Button>
        </div>
      </div>
      <div className={isMobile ? "max-h-[60vh] overflow-y-auto px-2" : ""}>
        {filteredClients.map((client) => (
          <label
            key={client.id}
            className="flex items-center space-x-2 hover:bg-accent rounded-lg p-2 cursor-pointer"
          >
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              checked={selectedClientIds.includes(client.id)}
              onChange={() => handleClientToggle(client.id)}
            />
            <span className="text-sm">{client.name}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`relative ${className}`}
          size="sm"
        >
          Seleccionar clientes
          {selectedClientIds.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">
              {selectedClientIds.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {clientList}
      </PopoverContent>
    </Popover>
  );
};
