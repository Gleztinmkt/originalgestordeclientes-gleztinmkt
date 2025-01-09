import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentReminder } from "./PaymentReminder";
import { TaskInput } from "../TaskInput";
import { TaskList } from "../TaskList";
import { Client, ClientInfo } from "../types/client";
import { getSubtleGradient } from "./utils/gradients";
import { ClientCardHeader } from "./card/CardHeader";
import { PackageSection } from "./card/PackageSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Task } from "../TaskList";

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleUpdateClientInfo = (clientId: string, info: ClientInfo) => {
    onUpdateClient(clientId, { clientInfo: info });
  };

  const handleUpdatePackagePaid = (packageId: string, paid: boolean) => {
    const updatedPackages = client.packages.map(pkg =>
      pkg.id === packageId ? { ...pkg, paid } : pkg
    );
    onUpdateClient(client.id, { ...client, packages: updatedPackages });
  };

  const handleEditPackage = (packageId: string, values: any) => {
    const updatedPackages = client.packages.map(pkg =>
      pkg.id === packageId ? { ...pkg, ...values } : pkg
    );
    onUpdateClient(client.id, { ...client, packages: updatedPackages });
  };

  const handleDeletePackage = (packageId: string) => {
    const updatedPackages = client.packages.filter(pkg => pkg.id !== packageId);
    onUpdateClient(client.id, { ...client, packages: updatedPackages });
  };

  const getClientTasks = () => {
    return tasks.filter(task => task.clientId === client.id);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDeleteClient(client.id);
    setShowDeleteDialog(false);
    if (viewMode === "grid") {
      setIsExpanded(false);
    }
  };

  const content = (
    <>
      <ClientCardHeader
        client={client}
        viewMode={viewMode}
        onUpdateClientInfo={handleUpdateClientInfo}
        onDeleteClient={handleDelete}
        onUpdateClient={onUpdateClient}
        onAddPackage={onAddPackage}
        isExpanded={isExpanded}
        onClose={() => setIsExpanded(false)}
      />
      <CardContent className="space-y-4">
        <PaymentReminder
          clientName={client.name}
          paymentDay={client.paymentDay}
          phone={client.phone}
        />

        <PackageSection
          client={client}
          isCapturing={isCapturing}
          onUpdatePackage={onUpdatePackage}
          onUpdatePaid={handleUpdatePackagePaid}
          onEditPackage={handleEditPackage}
          onDeletePackage={handleDeletePackage}
          onCaptureStart={() => setIsCapturing(true)}
          onCaptureEnd={() => setIsCapturing(false)}
        />

        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Tareas Pendientes</h3>
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

        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
          {client.marketingInfo}
        </p>
      </CardContent>
    </>
  );

  return (
    <>
      {viewMode === "grid" ? (
        <>
          <Card 
            className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer h-full dark:bg-gray-800/50 dark:border-gray-700" 
            style={{ background: getSubtleGradient() }}
            onClick={() => setIsExpanded(true)}
          >
            <CardContent className="p-4">
              <h3 className="text-lg font-heading font-semibold text-gray-800 dark:text-white truncate">
                {client.name}
              </h3>
            </CardContent>
          </Card>

          <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-gray-800">
              {content}
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Card 
          className="glass-card hover:shadow-lg transition-all duration-300 dark:bg-gray-800/50 dark:border-gray-700" 
          style={{ background: getSubtleGradient() }}
        >
          {content}
        </Card>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente y todos sus datos asociados serán eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};