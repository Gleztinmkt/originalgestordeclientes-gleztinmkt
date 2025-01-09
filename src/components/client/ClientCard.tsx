import { useState } from "react";
import { Card } from "@/components/ui/card";
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
import { ClientCardProps } from "./types/clientCard";
import { ClientCardHeader } from "./ClientCardHeader";
import { ClientCardContent } from "./ClientCardContent";
import { ClientInfo } from "@/components/types/client";

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

  const getSubtleGradient = () => {
    const gradients = [
      'linear-gradient(to right, #accbee 0%, #e7f0fd 100%)',
      'linear-gradient(to top, #e6e9f0 0%, #eef1f5 100%)',
      'linear-gradient(109.6deg, rgba(223,234,247,1) 11.2%, rgba(244,248,252,1) 91.1%)',
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  const content = (
    <>
      <ClientCardHeader
        client={client}
        viewMode={viewMode}
        onUpdateClientInfo={handleUpdateClientInfo}
        onUpdateClient={onUpdateClient}
        onAddPackage={onAddPackage}
        onShowDeleteDialog={() => setShowDeleteDialog(true)}
        onCloseExpanded={() => setIsExpanded(false)}
      />
      <ClientCardContent
        client={client}
        tasks={tasks}
        onUpdatePackagePaid={handleUpdatePackagePaid}
        onEditPackage={handleEditPackage}
        onDeletePackage={handleDeletePackage}
        onAddTask={onAddTask}
        onDeleteTask={onDeleteTask}
        onCompleteTask={onCompleteTask}
        onUpdateTask={onUpdateTask}
        isCapturing={isCapturing}
        setIsCapturing={setIsCapturing}
      />
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
            <ClientCardHeader
              client={client}
              viewMode={viewMode}
              onUpdateClientInfo={handleUpdateClientInfo}
              onUpdateClient={onUpdateClient}
              onAddPackage={onAddPackage}
              onShowDeleteDialog={() => setShowDeleteDialog(true)}
              onCloseExpanded={() => setIsExpanded(false)}
            />
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
            <AlertDialogAction 
              onClick={() => {
                onDeleteClient(client.id);
                setShowDeleteDialog(false);
                if (viewMode === "grid") {
                  setIsExpanded(false);
                }
              }} 
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};