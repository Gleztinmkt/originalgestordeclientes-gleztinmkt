import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { ClientPackage } from "../ClientPackage";
import { Client } from "../../types/client";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface PackageSectionProps {
  client: Client;
  isCapturing: boolean;
  onUpdatePackage: (clientId: string, packageId: string, usedPublications: number) => void;
  onUpdatePaid: (packageId: string, paid: boolean) => void;
  onEditPackage: (packageId: string, values: any) => void;
  onDeletePackage: (packageId: string) => void;
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

    onCaptureStart();
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
      onCaptureEnd();
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
            onUpdateUsed={(newCount) => {
              onUpdatePackage(client.id, pkg.id, newCount);
              if (newCount === pkg.totalPublications) {
                sendPackageCompletionMessage(pkg.name, pkg.month);
              }
            }}
            onUpdatePaid={(paid) => onUpdatePaid(pkg.id, paid)}
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
    </div>
  );
};