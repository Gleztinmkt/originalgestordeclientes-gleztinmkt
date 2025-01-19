import { useState } from "react";
import { BulkMessageButton } from "./client/BulkMessageButton";
import { ClientFilter } from "./client/ClientFilter";
import { ClientCard } from "./client/ClientCard";
import { Task } from "./TaskList";
import { Client } from "./types/client";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Grid3x3, List, Search, DollarSign } from "lucide-react";

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

  const getSubtleGradient = (index: number) => {
    const gradients = [
      'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
      'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20'
    ];
    return gradients[index % gradients.length];
  };

  const filteredClients = clients
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <ClientFilter onFilterChange={setSelectedPaymentDay} />
          <Button
            variant={showPendingPayments ? "default" : "outline"}
            onClick={() => setShowPendingPayments(!showPendingPayments)}
            className="gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Pagos pendientes
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-background border border-input rounded-lg p-1">
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
          />
        </div>
      </div>

      <div className={viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
        : "space-y-6"
      }>
        {filteredClients.map((client, index) => (
          <div key={client.id} className={getSubtleGradient(index)}>
            <ClientCard
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
            />
          </div>
        ))}
      </div>
    </div>
  );
};