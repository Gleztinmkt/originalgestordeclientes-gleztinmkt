import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Client {
  name: string;
  phone: string;
  paymentDay: number;
  packages: any[];
}

interface BulkMessageButtonProps {
  clients: Client[];
  selectedPaymentDay?: number;
  searchQuery?: string;
  showPendingPayments?: boolean;
}

export const BulkMessageButton = ({ 
  clients, 
  selectedPaymentDay,
  searchQuery = "",
  showPendingPayments = false
}: BulkMessageButtonProps) => {
  const getFilteredClients = () => {
    return clients.filter(client => {
      if (selectedPaymentDay && client.paymentDay !== selectedPaymentDay) {
        return false;
      }

      if (searchQuery && !client.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (showPendingPayments && !client.packages.some(pkg => !pkg.paid)) {
        return false;
      }

      return true;
    });
  };

  const sendBulkMessages = () => {
    const filteredClients = getFilteredClients();

    if (filteredClients.length === 0) {
      toast({
        title: "No hay clientes",
        description: "No hay clientes que cumplan con los filtros seleccionados",
        variant: "destructive",
      });
      return;
    }

    filteredClients.forEach(client => {
      if (client.phone) {
        const paymentDay = client.paymentDay || 1;
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Calcular la fecha 5 días antes del pago
        const paymentDate = new Date(currentYear, currentMonth, paymentDay);
        const reminderDate = new Date(paymentDate);
        reminderDate.setDate(paymentDate.getDate() - 5);

        const message = `Buenos días ${client.name}, este es un mensaje automático.\n\n` +
          `Les recordamos la fecha de pago del día ${reminderDate.getDate()} al ${paymentDay} de cada mes.\n\n` +
          `Los valores actualizados los vas a encontrar en el *siguiente link*:\n\n` +
          `https://gleztin.com.ar/index.php/valores-de-redes-sociales/\n` +
          `*Contraseña*: Gleztin (Con mayuscula al inicio)\n\n` +
          `En caso de tener alguna duda o no poder abonarlo dentro de la fecha establecida por favor contáctarnos.\n\n` +
          `Muchas gracias`;

        const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    });

    toast({
      title: "Mensajes enviados",
      description: `Se abrieron ${filteredClients.length} chats de WhatsApp`,
    });
  };

  const sendValuesUpdateMessage = () => {
    const filteredClients = getFilteredClients();

    if (filteredClients.length === 0) {
      toast({
        title: "No hay clientes",
        description: "No hay clientes que cumplan con los filtros seleccionados",
        variant: "destructive",
      });
      return;
    }

    filteredClients.forEach(client => {
      if (client.phone) {
        const message = `Hola ${client.name}, a partir de mañana 25 van a entrar en vigencia los valores actualizados. Los mismos los vas a encontrar en el siguiente link:\n\n` +
          `*Link*: https://gleztin.com.ar/index.php/valores-de-redes-sociales/\n\n` +
          `*Contraseña*: Gleztin (con mayúscula al inicio)\n\n` +
          `*En caso de no haber abonado el paquete anterior se cobrará con los valores actuales.*\n\n` +
          `Todos los *25 de cada mes* vamos a actualizar los valores en este mismo link.\n\n` +
          `Que tengas un buen día\n\n` +
          `ATTE: Gleztin Marketing Digital`;
        const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    });

    toast({
      title: "Mensajes enviados",
      description: `Se abrieron ${filteredClients.length} chats de WhatsApp`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Enviar Mensajes Masivos
          {selectedPaymentDay && ` (Día ${selectedPaymentDay})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={sendBulkMessages}>
          Recordatorio de pago
        </DropdownMenuItem>
        <DropdownMenuItem onClick={sendValuesUpdateMessage}>
          Actualización de valores
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};