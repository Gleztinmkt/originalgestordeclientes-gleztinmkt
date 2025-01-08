import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ClientPackage } from "./ClientPackage";
import { PaymentReminder } from "./PaymentReminder";
import { TaskInput } from "../TaskInput";
import { TaskList, Task } from "../TaskList";
import { ClientInfoDialog } from "./ClientInfoDialog";
import { EditClientDialog } from "./EditClientDialog";
import { AddPackageDialog } from "./AddPackageDialog";
import { Client, ClientInfo } from "../types/client";
import { PublicationCalendarDialog } from "./PublicationCalendarDialog";
import { useState } from "react";

interface ClientCardProps {
  client: Client;
  onDeleteClient: (id: string) => void;
  onUpdateClient: (id: string, data: any) => void;
  onUpdatePackage: (clientId: string, packageId: string, usedPublications: number) => void;
  onAddPackage: (clientId: string, packageData: any) => void;
  tasks: Task[];
  onAddTask: (content: string, clientId?: string) => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onUpdateTask: (id: string, task: Partial<Task>) => void;
  viewMode: "list" | "grid";
}

const getSubtleGradient = () => {
  return 'linear-gradient(to top, #f8f9fa 0%, #ffffff 100%)';
};

export const ClientCard = ({
  client,
  onDeleteClient,
  onUpdateClient,
  onUpdatePackage,
  onAddPackage,
  tasks,
  onAddTask,
  onDeleteTask,
  onCompleteTask,
  onUpdateTask,
  viewMode
}: ClientCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleUpdatePackagePaid = (packageId: string, paid: boolean) => {
    const updatedPackages = client.packages.map(pkg => 
      pkg.id === packageId ? { ...pkg, paid } : pkg
    );
    onUpdateClient(client.id, { ...client, packages: updatedPackages });
  };

  const handleEditPackage = (packageId: string, values: any) => {
    const updatedPackages = client.packages.map(pkg => 
      pkg.id === packageId ? {
        ...pkg,
        name: values.name,
        totalPublications: parseInt(values.totalPublications),
        month: values.month,
        paid: values.paid
      } : pkg
    );
    onUpdateClient(client.id, { ...client, packages: updatedPackages });
  };

  const handleDeletePackage = (packageId: string) => {
    const updatedPackages = client.packages.filter(pkg => pkg.id !== packageId);
    onUpdateClient(client.id, { ...client, packages: updatedPackages });
  };

  const handleUpdateClientInfo = (_clientId: string, info: ClientInfo) => {
    onUpdateClient(client.id, { ...client, clientInfo: info });
  };

  const getClientTasks = () => {
    return tasks.filter(task => task.clientId === client.id);
  };

  if (viewMode === "grid" && !isExpanded) {
    return (
      <Card 
        className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer h-full" 
        style={{ background: getSubtleGradient() }}
        onClick={() => setIsExpanded(true)}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-heading font-semibold text-gray-800 truncate">
            {client.name}
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card 
      className="glass-card hover:shadow-lg transition-all duration-300" 
      style={{ background: getSubtleGradient() }}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-heading font-semibold text-gray-800">
          {client.name}
        </CardTitle>
        <div className="flex gap-2">
          <ClientInfoDialog
            clientId={client.id}
            clientInfo={client.clientInfo}
            onUpdateInfo={handleUpdateClientInfo}
          />
          <PublicationCalendarDialog 
            clientId={client.id}
            clientName={client.name}
          />
          <EditClientDialog 
            client={client}
            onUpdateClient={onUpdateClient}
          />
          <AddPackageDialog
            clientId={client.id}
            onAddPackage={onAddPackage}
          />
          {viewMode === "grid" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors duration-200"
            >
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <PaymentReminder
          clientName={client.name}
          paymentDay={client.paymentDay}
          phone={client.phone}
        />

        {client.packages.map((pkg) => (
          <ClientPackage
            key={pkg.id}
            packageName={pkg.name}
            totalPublications={pkg.totalPublications}
            usedPublications={pkg.usedPublications}
            month={pkg.month}
            paid={pkg.paid}
            onUpdateUsed={(newCount) => onUpdatePackage(client.id, pkg.id, newCount)}
            onUpdatePaid={(paid) => handleUpdatePackagePaid(pkg.id, paid)}
            onEditPackage={(values) => handleEditPackage(pkg.id, values)}
            onDeletePackage={() => handleDeletePackage(pkg.id)}
            clientId={client.id}
            clientName={client.name}
            packageId={pkg.id}
          />
        ))}

        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Tareas Pendientes</h3>
          <TaskInput 
            onAddTask={(content) => onAddTask(content, client.id)}
            clients={[{ id: client.id, name: client.name }]}
          />
          <TaskList
            tasks={getClientTasks()}
            onDeleteTask={onDeleteTask}
            onCompleteTask={onCompleteTask}
            onUpdateTask={onUpdateTask}
            clients={[{ id: client.id, name: client.name }]}
          />
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mt-4">
          {client.marketingInfo}
        </p>
      </CardContent>
    </Card>
  );
};