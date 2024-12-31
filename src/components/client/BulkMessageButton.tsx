import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

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
        const message = `Buenos días ${client.name}, este es un recordatorio de pago para el día ${client.paymentDay} del mes. Gracias por su atención.`;
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
    <Button onClick={sendBulkMessages} className="w-full gap-2">
      <MessageSquare className="h-4 w-4" />
      Enviar Mensajes Masivos
      {selectedPaymentDay && ` (Día ${selectedPaymentDay})`}
    </Button>
  );
};