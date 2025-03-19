
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentReminder } from "./PaymentReminder";
import { TaskInput } from "../TaskInput";
import { TaskList } from "../TaskList";
import { Client, ClientInfo } from "../types/client";
import { getSubtleGradient, getBorderColor } from "./utils/gradients";
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
import { toast } from "@/hooks/use-toast";

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
  index: number;
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
  viewMode,
  index
}: ClientCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateClientInfo = async (clientId: string, info: ClientInfo) => {
    try {
      await onUpdateClient(clientId, { clientInfo: info });
    } catch (error) {
      console.error('Error updating client info:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del cliente.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePackagePaid = async (packageId: string, paid: boolean) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      // Create a new array instead of modifying the existing one
      const updatedPackages = client.packages.map(pkg =>
        pkg.id === packageId ? { ...pkg, paid } : pkg
      );
      
      await onUpdateClient(client.id, { 
        packages: updatedPackages 
      });
    } catch (error) {
      console.error('Error updating package paid status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pago.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditPackage = async (packageId: string, values: any) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      // Create a new array instead of modifying the existing one
      const updatedPackages = client.packages.map(pkg =>
        pkg.id === packageId ? { ...pkg, ...values } : pkg
      );
      
      await onUpdateClient(client.id, { 
        packages: updatedPackages 
      });
      
      toast({
        title: "Paquete actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    } catch (error) {
      console.error('Error editing package:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paquete.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      // Create a new array by filtering out the package to delete
      const updatedPackages = client.packages.filter(pkg => pkg.id !== packageId);
      
      await onUpdateClient(client.id, { 
        packages: updatedPackages 
      });
      
      toast({
        title: "Paquete eliminado",
        description: "El paquete se ha eliminado correctamente.",
      });
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el paquete.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
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

  const cardClasses = `glass-card hover:shadow-lg transition-all duration-300 dark:bg-gray-800/50 dark:border-gray-700 border-2 ${getBorderColor(index)}`;

  return (
    <>
      {viewMode === "grid" ? (
        <>
          <Card 
            className={cardClasses}
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
          className={cardClasses}
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
