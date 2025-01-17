import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { ClientPackage } from "../ClientPackage";
import { Client } from "../../types/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PackageSectionProps {
  client: Client;
  isCapturing: boolean;
  onUpdatePackage: (clientId: string, packageId: string, usedPublications: number) => void;
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
  const sendPackageReport = async (): Promise<void> => {
    if (!client.phone) {
      toast({
        title: "Error",
        description: "Este cliente no tiene número de teléfono registrado",
        variant: "destructive",
      });
      return Promise.resolve();
    }

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
    
    return Promise.resolve();
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
            lastUpdate={pkg.last_update}
            onUpdateUsed={(newCount) => onUpdatePackage(client.id, pkg.id, newCount)}
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
          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <FileText className="h-4 w-4" />
          Enviar reporte de paquetes
        </Button>
      )}
    </div>
  );
};