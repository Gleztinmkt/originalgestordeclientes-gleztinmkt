
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
import { useState, useEffect } from "react";

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
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  let message = "";

  if (includePeriod) {
    const paymentDate = new Date(currentYear, currentMonth, paymentDay);
    const reminderDate = format(addDays(paymentDate, -5), "d", { locale: es });
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

// Default templates
const DEFAULT_TEMPLATES = {
  paymentReminder: `*Buenos días, {nombre}.*

Este es un mensaje automático.

Les recordamos que la fecha de pago es el día {paymentDay} de cada mes.

Los valores actualizados pueden encontrarlos en el siguiente enlace:
*Link:* https://gleztin.com.ar/index.php/valores-de-redes-sociales/
*Contraseña:* Gleztin (con mayúscula al inicio).

Si ya realizó el pago o la fecha indicada es incorrecta, le pedimos que nos lo informe.

En caso de tener alguna duda o no poder realizar el pago dentro de la fecha establecida, por favor, contáctenos.

Muchas gracias.`,
  paymentReminderWithPeriod: `*Buenos días, {nombre}.*

Este es un mensaje automático.

Les recordamos la fecha de pago del día {reminderDay} al {paymentDay} de cada mes.

Los valores actualizados pueden encontrarlos en el siguiente enlace:
*Link:* https://gleztin.com.ar/index.php/valores-de-redes-sociales/
*Contraseña:* Gleztin (con mayúscula al inicio).

Si ya realizó el pago o la fecha indicada es incorrecta, le pedimos que nos lo informe.

En caso de tener alguna duda o no poder realizar el pago dentro de la fecha establecida, por favor, contáctenos.

Muchas gracias.`,
  valuesUpdate: `Hola {nombre}, a partir de mañana 25 van a entrar en vigencia los valores actualizados. Los mismos los vas a encontrar en el siguiente link:

*Link*: https://gleztin.com.ar/index.php/valores-de-redes-sociales/

*Contraseña*: Gleztin (con mayúscula al inicio)

*En caso de no haber abonado el paquete anterior se cobrará con los valores actuales.*

Todos los *25 de cada mes* vamos a actualizar los valores en este mismo link.

Que tengas un buen día

ATTE: Gleztin Marketing Digital`
};

export const BulkMessageButton = ({ 
  clients, 
  selectedPaymentDay,
  searchQuery = "",
  showPendingPayments = false,
  selectedClientIds = []
}: BulkMessageButtonProps) => {
  const [isCustomMessageDialogOpen, setIsCustomMessageDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [currentTemplate, setCurrentTemplate] = useState("");
  const [currentMessageType, setCurrentMessageType] = useState<'paymentReminder' | 'paymentReminderWithPeriod' | 'valuesUpdate' | 'custom'>('paymentReminder');
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);

  useEffect(() => {
    const savedTemplates = localStorage.getItem('bulkMessageTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const saveTemplates = (newTemplates: typeof DEFAULT_TEMPLATES) => {
    setTemplates(newTemplates);
    localStorage.setItem('bulkMessageTemplates', JSON.stringify(newTemplates));
  };

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

  const openTemplateDialog = (messageType: 'paymentReminder' | 'paymentReminderWithPeriod' | 'valuesUpdate', includePeriod: boolean = false) => {
    setCurrentMessageType(messageType);
    let template = templates[messageType];
    
    if (messageType === 'paymentReminder' || messageType === 'paymentReminderWithPeriod') {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const paymentDay = selectedPaymentDay || 1;
      const reminderDate = format(addDays(new Date(currentYear, currentMonth, paymentDay), -5), "d", { locale: es });
      
      template = template.replace(/\{reminderDay\}/g, reminderDate.toString());
      template = template.replace(/\{paymentDay\}/g, paymentDay.toString());
    }
    
    setCurrentTemplate(template);
    setIsTemplateDialogOpen(true);
  };

  const sendBulkMessages = (includePeriod: boolean = false) => {
    const messageType = includePeriod ? 'paymentReminderWithPeriod' : 'paymentReminder';
    openTemplateDialog(messageType, includePeriod);
  };

  const sendValuesUpdateMessage = () => {
    openTemplateDialog('valuesUpdate');
  };

  const confirmAndSendMessages = () => {
    const filteredClients = getFilteredClients();

    if (filteredClients.length === 0) {
      toast({
        title: "No hay clientes",
        description: "No hay clientes que cumplan con los filtros seleccionados",
        variant: "destructive",
      });
      return;
    }

    if (!currentTemplate.trim()) {
      toast({
        title: "Mensaje vacío",
        description: "Por favor, escribe un mensaje para enviar",
        variant: "destructive",
      });
      return;
    }

    // Save template if it was modified
    if (currentMessageType !== 'custom') {
      const updatedTemplates = { ...templates };
      updatedTemplates[currentMessageType as keyof typeof DEFAULT_TEMPLATES] = currentTemplate;
      saveTemplates(updatedTemplates);
    }

    filteredClients.forEach(client => {
      if (client.phone) {
        let personalizedMessage = currentTemplate.replace(/\{nombre\}/g, client.name);
        
        if (currentMessageType === 'paymentReminder' || currentMessageType === 'paymentReminderWithPeriod') {
          personalizedMessage = personalizedMessage.replace(/\{paymentDay\}/g, client.paymentDay.toString());
          
          if (currentMessageType === 'paymentReminderWithPeriod') {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const reminderDate = format(addDays(new Date(currentYear, currentMonth, client.paymentDay), -5), "d", { locale: es });
            personalizedMessage = personalizedMessage.replace(/\{reminderDay\}/g, reminderDate);
          }
        }
        
        const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(personalizedMessage)}`;
        window.open(whatsappUrl, '_blank');
      }
    });

    toast({
      title: "Mensajes enviados",
      description: `Se abrieron ${filteredClients.length} chats de WhatsApp`,
    });

    setIsTemplateDialogOpen(false);
    setCurrentTemplate("");
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

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Confirmar plantilla de mensaje</DialogTitle>
            <DialogDescription>
              Revisa y edita la plantilla antes de enviar. Los cambios se guardarán automáticamente.
              {currentMessageType !== 'custom' && (
                <>
                  <br />Variables disponibles: {"{nombre}"} para el nombre del cliente
                  {(currentMessageType === 'paymentReminder' || currentMessageType === 'paymentReminderWithPeriod') && 
                    ', {paymentDay} para el día de pago'
                  }
                  {currentMessageType === 'paymentReminderWithPeriod' && 
                    ', {reminderDay} para el día de recordatorio'
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={currentTemplate}
              onChange={(e) => setCurrentTemplate(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="min-h-[300px]"
            />
            <div className="flex gap-2">
              <Button onClick={confirmAndSendMessages} className="flex-1">
                Confirmar y enviar mensajes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (currentMessageType !== 'custom') {
                    const updatedTemplates = { ...templates };
                    updatedTemplates[currentMessageType as keyof typeof DEFAULT_TEMPLATES] = currentTemplate;
                    saveTemplates(updatedTemplates);
                    toast({
                      title: "Plantilla guardada",
                      description: "Los cambios en la plantilla se han guardado correctamente",
                    });
                  }
                }}
              >
                Guardar plantilla
              </Button>
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
