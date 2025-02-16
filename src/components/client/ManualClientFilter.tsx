
import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Client } from "../types/client";

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
        <div className="p-2 border-b flex gap-2">
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
        <ScrollArea className="h-[300px]">
          <div className="p-2 space-y-2">
            {clients.map((client) => (
              <label
                key={client.id}
                className="flex items-center space-x-2 hover:bg-accent rounded-lg p-2 cursor-pointer"
              >
                <Checkbox
                  checked={selectedClientIds.includes(client.id)}
                  onCheckedChange={() => handleClientToggle(client.id)}
                />
                <span className="text-sm">{client.name}</span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
