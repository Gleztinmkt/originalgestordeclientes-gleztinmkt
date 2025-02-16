
import { useState } from "react";
import { BulkMessageButton } from "./client/BulkMessageButton";
import { ClientFilter } from "./client/ClientFilter";
import { ClientCard } from "./client/ClientCard";
import { Task } from "./TaskList";
import { Client } from "./types/client";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Grid3x3, List, Search, DollarSign } from "lucide-react";
import { ManualClientFilter } from "./client/ManualClientFilter";

interface ClientListProps {
  clients: Client[];
  onDeleteClient: (id: string) => void;
  onUpdateClient: (id: string, data: any) => void;
  onUpdatePackage: (clientId: string, packageId: string, usedPublications: number) => void;
  onAddPackage: (clientId: string, packageData: any) => void;
  tasks: Task[];
  onAddTask: (content: string, clientId?: string) => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onUpdateTask: (id: string, task: Partial<Task>) => void;
}

export const ClientList = ({ 
  clients, 
  onDeleteClient, 
  onUpdateClient,
  onUpdatePackage,
  onAddPackage,
  tasks,
  onAddTask,
  onDeleteTask,
  onCompleteTask,
  onUpdateTask
}: ClientListProps) => {
  const [selectedPaymentDay, setSelectedPaymentDay] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showPendingPayments, setShowPendingPayments] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

  const getSubtleGradient = (index: number) => {
    const gradients = [
      'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700',
      'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700',
      'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700',
      'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-800 dark:to-gray-700',
      'bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-700'
    ];
    return gradients[index % gradients.length];
  };

  const filteredClients = clients
    .filter(client => {
      // Filter by manually selected clients
      if (selectedClientIds.length > 0) {
        return selectedClientIds.includes(client.id);
      }
      return true;
    })
    .filter(client => {
      if (showPendingPayments) {
        return client.packages.some(pkg => !pkg.paid);
      }
      return true;
    })
    .filter(client => selectedPaymentDay === "all" || client.paymentDay === parseInt(selectedPaymentDay))
    .filter(client => 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.marketingInfo?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        {/* Búsqueda */}
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-10 text-base w-full"
          />
        </div>

        {/* Filtros (en línea en desktop, apilados en móvil) */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:space-x-2">
          <div className="flex flex-col gap-2 md:flex-row md:flex-1">
            <ManualClientFilter 
              clients={clients}
              selectedClientIds={selectedClientIds}
              onSelectedClientsChange={setSelectedClientIds}
              className="w-full md:w-auto"
            />
            <ClientFilter 
              onFilterChange={setSelectedPaymentDay}
              className="w-full md:w-auto"
            />
            <Button
              variant={showPendingPayments ? "default" : "outline"}
              onClick={() => setShowPendingPayments(!showPendingPayments)}
              className="gap-2 text-sm w-full md:w-auto"
            >
              <DollarSign className="h-4 w-4" />
              <span>Pagos pendientes</span>
            </Button>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex items-center bg-background border border-input rounded-lg p-1 w-fit">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
            <BulkMessageButton 
              clients={clients}
              selectedPaymentDay={selectedPaymentDay !== "all" ? parseInt(selectedPaymentDay) : undefined}
              searchQuery={searchQuery}
              showPendingPayments={showPendingPayments}
              selectedClientIds={selectedClientIds}
            />
          </div>
        </div>
      </div>

      <div className={viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
        : "space-y-6"
      }>
        {filteredClients.map((client, index) => (
          <ClientCard
            key={client.id}
            client={client}
            onDeleteClient={onDeleteClient}
            onUpdateClient={onUpdateClient}
            onUpdatePackage={onUpdatePackage}
            onAddPackage={onAddPackage}
            tasks={tasks}
            onAddTask={onAddTask}
            onDeleteTask={onDeleteTask}
            onCompleteTask={onCompleteTask}
            onUpdateTask={onUpdateTask}
            viewMode={viewMode}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};
