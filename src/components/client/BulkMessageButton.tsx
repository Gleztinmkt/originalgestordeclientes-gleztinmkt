
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface Client {
  id: string;
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
  selectedClientIds?: string[];
}

const createPaymentMessage = (clientName: string, paymentDay: number, includePeriod: boolean = false) => {
  const today = new Date();
  let message = "";

  if (includePeriod && paymentDay >= 1 && paymentDay <= 5) {
    const reminderDate = format(addDays(today, -5), "d", { locale: es });
    message = `*Buenos días, ${clientName}.*\n\n` +
      `Este es un mensaje automático.\n\n` +
      `Les recordamos la fecha de pago del día ${reminderDate} al ${paymentDay} de cada mes.\n\n`;
  } else {
    message = `*Buenos días, ${clientName}.*\n\n` +
      `Este es un mensaje automático.\n\n` +
      `Les recordamos que la fecha de pago es el día ${paymentDay} de cada mes.\n\n`;
  }

  message += `Los valores actualizados pueden encontrarlos en el siguiente enlace:\n` +
    `*Link:* https://gleztin.com.ar/index.php/valores-de-redes-sociales/\n` +
    `*Contraseña:* Gleztin (con mayúscula al inicio).\n\n` +
    `Si ya realizó el pago o la fecha indicada es incorrecta, le pedimos que nos lo informe.\n\n` +
    `En caso de tener alguna duda o no poder realizar el pago dentro de la fecha establecida, por favor, contáctenos.\n\n` +
    `Muchas gracias.`;

  return message;
};

export const BulkMessageButton = ({ 
  clients, 
  selectedPaymentDay,
  searchQuery = "",
  showPendingPayments = false,
  selectedClientIds = []
}: BulkMessageButtonProps) => {
  const [isCustomMessageDialogOpen, setIsCustomMessageDialogOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const getFilteredClients = () => {
    return clients.filter(client => {
      if (selectedClientIds.length > 0 && !selectedClientIds.includes(client.id)) {
        return false;
      }

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

  const sendBulkMessages = (includePeriod: boolean = false) => {
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
        const message = createPaymentMessage(client.name, client.paymentDay, includePeriod);
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

  const sendCustomMessage = () => {
    const filteredClients = getFilteredClients();

    if (filteredClients.length === 0) {
      toast({
        title: "No hay clientes",
        description: "No hay clientes que cumplan con los filtros seleccionados",
        variant: "destructive",
      });
      return;
    }

    if (!customMessage.trim()) {
      toast({
        title: "Mensaje vacío",
        description: "Por favor, escribe un mensaje para enviar",
        variant: "destructive",
      });
      return;
    }

    filteredClients.forEach(client => {
      if (client.phone) {
        const personalizedMessage = customMessage.replace(/\{nombre\}/g, client.name);
        const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(personalizedMessage)}`;
        window.open(whatsappUrl, '_blank');
      }
    });

    toast({
      title: "Mensajes enviados",
      description: `Se abrieron ${filteredClients.length} chats de WhatsApp`,
    });

    setIsCustomMessageDialogOpen(false);
    setCustomMessage("");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Enviar Mensajes Masivos
            {selectedPaymentDay && ` (Día ${selectedPaymentDay})`}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              Recordatorio de pago
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => sendBulkMessages(true)}>
                  Con plazo (5 días)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => sendBulkMessages(false)}>
                  Sin plazo
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={sendValuesUpdateMessage}>
            Actualización de valores
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsCustomMessageDialogOpen(true)}>
            Mensaje personalizado
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCustomMessageDialogOpen} onOpenChange={setIsCustomMessageDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enviar mensaje personalizado</DialogTitle>
            <DialogDescription>
              Escribe tu mensaje. Usa {"{nombre}"} para incluir el nombre del cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="min-h-[200px]"
            />
            <Button onClick={sendCustomMessage} className="w-full">
              Enviar mensajes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
