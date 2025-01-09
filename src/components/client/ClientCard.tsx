import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, X, MessageSquare, FileText } from "lucide-react";
import { ClientPackage } from "./ClientPackage";
import { PaymentReminder } from "./PaymentReminder";
import { TaskInput } from "../TaskInput";
import { TaskList, Task } from "../TaskList";
import { ClientInfoDialog } from "./ClientInfoDialog";
import { EditClientDialog } from "./EditClientDialog";
import { AddPackageDialog } from "./AddPackageDialog";
import { Client, ClientInfo } from "../types/client";
import { PublicationCalendarDialog } from "./PublicationCalendarDialog";
import { ClientCardProps } from "./types/clientCard";
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
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

const getSubtleGradient = () => {
  const gradients = [
    'linear-gradient(to right, #accbee 0%, #e7f0fd 100%)',
    'linear-gradient(to top, #e6e9f0 0%, #eef1f5 100%)',
    'linear-gradient(109.6deg, rgba(223,234,247,1) 11.2%, rgba(244,248,252,1) 91.1%)',
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

  const sendPackageCompletionMessage = (packageName: string, month: string) => {
    if (!client.phone) {
      toast({
        title: "Error",
        description: "Este cliente no tiene número de teléfono registrado",
        variant: "destructive",
      });
      return;
    }

    const message = `¡Hola! Te informamos que tu paquete "${packageName}" del mes de ${month} ha sido completado. Para continuar con nuestros servicios, te invitamos a realizar el pago del próximo paquete. ¡Gracias por confiar en nosotros!`;
    const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendPackageReport = async () => {
    if (!client.phone) {
      toast({
        title: "Error",
        description: "Este cliente no tiene número de teléfono registrado",
        variant: "destructive",
      });
      return;
    }

    setIsCapturing(true);
    try {
      const element = document.getElementById(`client-packages-${client.id}`);
      if (!element) return;

      const canvas = await html2canvas(element);
      const imageData = canvas.toDataURL('image/png');

      // Create a temporary link to download the image
      const tempLink = document.createElement('a');
      tempLink.href = imageData;
      tempLink.download = `reporte-${client.name}.png`;
      tempLink.click();

      const message = `¡Hola! Aquí te enviamos el reporte actual de tus paquetes de publicaciones.`;
      const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      toast({
        title: "Reporte generado",
        description: "El reporte ha sido generado y descargado. Ahora puedes enviarlo por WhatsApp.",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const content = (
    <>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-heading font-semibold text-gray-800 dark:text-white">
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
            onClick={handleDelete}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {viewMode === "grid" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
            >
              <X className="h-4 w-4" />
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

        <div id={`client-packages-${client.id}`} className="space-y-4">
          {client.packages.map((pkg) => (
            <ClientPackage
              key={pkg.id}
              packageName={pkg.name}
              totalPublications={pkg.totalPublications}
              usedPublications={pkg.usedPublications}
              month={pkg.month}
              paid={pkg.paid}
              onUpdateUsed={(newCount) => {
                onUpdatePackage(client.id, pkg.id, newCount);
                if (newCount === pkg.totalPublications) {
                  sendPackageCompletionMessage(pkg.name, pkg.month);
                }
              }}
              onUpdatePaid={(paid) => handleUpdatePackagePaid(pkg.id, paid)}
              onEditPackage={(values) => handleEditPackage(pkg.id, values)}
              onDeletePackage={() => handleDeletePackage(pkg.id)}
              clientId={client.id}
              clientName={client.name}
              packageId={pkg.id}
            />
          ))}
        </div>

        {client.packages.length > 0 && (
          <Button
            onClick={sendPackageReport}
            disabled={isCapturing}
            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <FileText className="h-4 w-4" />
            {isCapturing ? "Generando reporte..." : "Enviar reporte de paquetes"}
          </Button>
        )}

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
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading font-semibold text-gray-800 dark:text-white truncate">
                {client.name}
              </CardTitle>
            </CardHeader>
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
