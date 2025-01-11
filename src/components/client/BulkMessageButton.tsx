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
}

interface BulkMessageButtonProps {
  clients: Client[];
  selectedPaymentDay?: number;
}

export const BulkMessageButton = ({ clients, selectedPaymentDay }: BulkMessageButtonProps) => {
  const sendBulkMessages = () => {
    const filteredClients = selectedPaymentDay
      ? clients.filter(client => client.paymentDay === selectedPaymentDay)
      : clients;

    if (filteredClients.length === 0) {
      toast({
        title: "No hay clientes",
        description: "No hay clientes para enviar mensajes en esta fecha",
        variant: "destructive",
      });
      return;
    }

    filteredClients.forEach(client => {
      if (client.phone) {
        const message = `Buenos días ${client.name}, este es un mensaje automático.\n\nLes recordamos la fecha de pago del día ${client.paymentDay} de cada mes.\n\nMuchas gracias.\n\nEn caso de tener alguna duda o no poder abonarlo dentro de la fecha establecida por favor contáctarnos.\n\nSi los valores no fueron enviados por favor pedirlos.`;
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
    const filteredClients = clients;

    if (filteredClients.length === 0) {
      toast({
        title: "No hay clientes",
        description: "No hay clientes para enviar mensajes",
        variant: "destructive",
      });
      return;
    }

    filteredClients.forEach(client => {
      if (client.phone) {
        const message = `Hola ${client.name}, los valores actualizados los vas a encontrar en el siguiente link:\n\nhttps://gleztin.com.ar/index.php/valores-de-redes-sociales/\n\nContraseña: Gleztin`;
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
