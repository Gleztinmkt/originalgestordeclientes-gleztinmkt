import { useState } from "react";
import { BulkMessageButton } from "./client/BulkMessageButton";
import { ClientFilter } from "./client/ClientFilter";
import { ClientCard } from "./client/ClientCard";
import { Task } from "./TaskList";
import { Client } from "./types/client";

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

  const filteredClients = selectedPaymentDay === "all"
    ? clients
    : clients.filter(client => client.paymentDay === parseInt(selectedPaymentDay));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <ClientFilter onFilterChange={setSelectedPaymentDay} />
        <BulkMessageButton 
          clients={clients}
          selectedPaymentDay={selectedPaymentDay !== "all" ? parseInt(selectedPaymentDay) : undefined}
        />
      </div>

      <div className="space-y-6">
        {filteredClients.map((client) => (
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
          />
        ))}
      </div>
    </div>
  );
};