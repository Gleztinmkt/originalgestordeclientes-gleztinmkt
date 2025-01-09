import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { PaymentReminder } from "./PaymentReminder";
import { ClientPackage } from "./ClientPackage";
import { TaskInput } from "../TaskInput";
import { TaskList } from "../TaskList";
import { Client } from "../types/client";
import { Task } from "../TaskList";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface ClientCardContentProps {
  client: Client;
  tasks: Task[];
  onUpdatePackagePaid: (packageId: string, paid: boolean) => void;
  onEditPackage: (packageId: string, values: any) => void;
  onDeletePackage: (packageId: string) => void;
  onAddTask: (content: string, clientId?: string) => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onUpdateTask: (id: string, task: Partial<Task>) => void;
  isCapturing: boolean;
  setIsCapturing: (value: boolean) => void;
}

export const ClientCardContent = ({
  client,
  tasks,
  onUpdatePackagePaid,
  onEditPackage,
  onDeletePackage,
  onAddTask,
  onDeleteTask,
  onCompleteTask,
  onUpdateTask,
  isCapturing,
  setIsCapturing
}: ClientCardContentProps) => {
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

  const getClientTasks = () => {
    return tasks.filter(task => task.clientId === client.id);
  };

  return (
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
              onUpdatePackagePaid(pkg.id, pkg.paid);
              if (newCount === pkg.totalPublications) {
                sendPackageCompletionMessage(pkg.name, pkg.month);
              }
            }}
            onUpdatePaid={(paid) => onUpdatePackagePaid(pkg.id, paid)}
            onEditPackage={(values) => onEditPackage(pkg.id, values)}
            onDeletePackage={() => onDeletePackage(pkg.id)}
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
  );
};