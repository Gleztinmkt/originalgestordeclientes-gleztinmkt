
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { ClientPackage } from "../ClientPackage";
import { Client } from "../../types/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

interface PackageSectionProps {
  client: Client;
  isCapturing: boolean;
  onUpdatePackage: (clientId: string, packageId: string, usedPublications: number) => Promise<void>;
  onUpdatePaid: (packageId: string, paid: boolean) => Promise<void>;
  onEditPackage: (packageId: string, values: any) => Promise<void>;
  onDeletePackage: (packageId: string) => Promise<void>;
  onCaptureStart: () => void;
  onCaptureEnd: () => void;
}

export const PackageSection = ({
  client,
  isCapturing,
  onUpdatePackage,
  onUpdatePaid,
  onEditPackage,
  onDeletePackage,
  onCaptureStart,
  onCaptureEnd,
}: PackageSectionProps) => {
  const [processingPackageId, setProcessingPackageId] = useState<string | null>(null);
  const [isSendingReport, setIsSendingReport] = useState(false);

  const sendPackageReport = async (): Promise<void> => {
    if (!client.phone || isSendingReport) {
      if (!client.phone) {
        toast({
          title: "Error",
          description: "Este cliente no tiene número de teléfono registrado",
          variant: "destructive",
        });
      }
      return Promise.resolve();
    }

    try {
      setIsSendingReport(true);
      
      const currentDate = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });
      let reportText = `*Reporte de Paquetes - ${client.name}*\n`;
      reportText += `Generado el ${currentDate}\n\n`;

      client.packages.forEach((pkg, index) => {
        reportText += `*Paquete ${index + 1}:*\n`;
        reportText += `*Nombre:* ${pkg.name}\n`;
        reportText += `*Mes:* ${pkg.month}\n`;
        reportText += `*Estado de pago:* ${pkg.paid ? 'Pagado' : 'Pendiente'}\n`;
        reportText += `*Publicaciones usadas:* ${pkg.usedPublications}/${pkg.totalPublications}\n`;
        reportText += `*Publicaciones restantes:* ${pkg.totalPublications - pkg.usedPublications}\n\n`;
      });

      reportText += `\n*¡Gracias por confiar en Gleztin Marketing Digital!*\n`;
      reportText += `Estamos comprometidos con tu éxito en redes sociales.\n`;
      reportText += `Si tenés alguna pregunta, no dudes en contactarnos.`;

      const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(reportText)}`;
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "Reporte enviado",
        description: "Se ha abierto WhatsApp con el reporte generado.",
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error al enviar reporte:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleUpdatePaid = async (packageId: string, paid: boolean) => {
    if (processingPackageId) return;
    try {
      setProcessingPackageId(packageId);
      await onUpdatePaid(packageId, paid);
    } catch (error) {
      console.error('Error al actualizar estado de pago:', error);
    } finally {
      setProcessingPackageId(null);
    }
  };

  const handleEditPackage = async (packageId: string, values: any) => {
    if (processingPackageId) return;
    try {
      setProcessingPackageId(packageId);
      await onEditPackage(packageId, values);
    } catch (error) {
      console.error('Error al editar paquete:', error);
    } finally {
      setProcessingPackageId(null);
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (processingPackageId) return;
    try {
      setProcessingPackageId(packageId);
      await onDeletePackage(packageId);
    } catch (error) {
      console.error('Error al eliminar paquete:', error);
    } finally {
      setProcessingPackageId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div id={`client-packages-${client.id}`} className="space-y-4">
        {client.packages.map((pkg) => (
          <ClientPackage
            key={pkg.id}
            packageName={pkg.name}
            totalPublications={pkg.totalPublications}
            usedPublications={pkg.usedPublications}
            month={pkg.month}
            paid={pkg.paid}
            onUpdateUsed={(newCount) => onUpdatePackage(client.id, pkg.id, newCount)}
            onUpdatePaid={(paid) => handleUpdatePaid(pkg.id, paid)}
            onEditPackage={(values) => handleEditPackage(pkg.id, values)}
            onDeletePackage={() => handleDeletePackage(pkg.id)}
            clientId={client.id}
            clientName={client.name}
            packageId={pkg.id}
            isProcessing={processingPackageId === pkg.id}
          />
        ))}
      </div>

      {client.packages.length > 0 && (
        <Button
          onClick={sendPackageReport}
          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
          disabled={isSendingReport}
        >
          <FileText className="h-4 w-4" />
          {isSendingReport ? "Enviando..." : "Enviar reporte de paquetes"}
        </Button>
      )}
    </div>
  );
};
