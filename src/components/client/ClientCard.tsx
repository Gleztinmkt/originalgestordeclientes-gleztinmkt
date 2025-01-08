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
}

const getRandomPastelGradient = () => {
  const gradients = [
    'linear-gradient(to top, #e6e9f0 0%, #eef1f5 100%)',
    'linear-gradient(to top, #accbee 0%, #e7f0fd 100%)',
    'linear-gradient(90deg, hsla(186, 33%, 94%, 1) 0%, hsla(216, 41%, 79%, 1) 100%)',
    'linear-gradient(109.6deg, rgba(223,234,247,1) 11.2%, rgba(244,248,252,1) 91.1%)',
    'linear-gradient(to right, #ee9ca7, #ffdde1)'
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
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
  onUpdateTask
}: ClientCardProps) => {
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

  return (
    <Card className="glass-card hover:shadow-lg transition-all duration-300" style={{ background: getRandomPastelGradient() }}>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteClient(client.id)}
            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
