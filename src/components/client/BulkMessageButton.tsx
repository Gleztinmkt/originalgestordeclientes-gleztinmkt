
import { MessageSquare, Copy, Loader2 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
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
  
  // Estado para el sistema de envío mejorado
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

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

  // Función para formatear números de teléfono
  const formatPhoneNumber = (phone: string): string => {
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Handle Argentina phone number formatting
    if (cleanPhone.startsWith('549')) {
      // Already has correct format: 549XXXXXXXX
      return cleanPhone;
    } else if (cleanPhone.startsWith('54')) {
      // Has 54 but missing 9: 54XXXXXXXX -> 549XXXXXXXX
      return '549' + cleanPhone.substring(2);
    } else if (cleanPhone.startsWith('0')) {
      // Starts with 0: 0XXXXXXXX -> 549XXXXXXXX
      return '549' + cleanPhone.substring(1);
    } else {
      // Just the number: XXXXXXXX -> 549XXXXXXXX
      return '549' + cleanPhone;
    }
  };

  // Función para copiar enlaces al portapapeles
  const copyLinksToClipboard = async (links: string[]) => {
    const text = links.join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Enlaces copiados",
        description: "Los enlaces de WhatsApp se copiaron al portapapeles",
      });
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
      toast({
        title: "Error",
        description: "No se pudieron copiar los enlaces al portapapeles",
        variant: "destructive",
      });
    }
  };

  // Función para enviar mensajes de forma secuencial con delay
  const sendMessagesSequentially = async (messages: Array<{client: Client, message: string, url: string}>) => {
    setIsSending(true);
    setTotalMessages(messages.length);
    setCurrentMessageIndex(0);
    setSendingProgress(0);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < messages.length; i++) {
      const { client, url } = messages[i];
      setCurrentMessageIndex(i + 1);
      setSendingProgress(((i + 1) / messages.length) * 100);

      try {
        // Intentar abrir la ventana con configuración específica para evitar CORP
        const newWindow = window.open(
          url, 
          '_blank',
          'noopener=yes,noreferrer=yes,width=800,height=600'
        );
        
        if (!newWindow) {
          throw new Error('Ventana bloqueada por el navegador');
        }
        
        successCount++;
      } catch (error) {
        console.error(`Error al enviar mensaje a ${client.name}:`, error);
        failedCount++;
      }

      // Delay entre mensajes para evitar bloqueo del navegador
      if (i < messages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    setIsSending(false);
    setSendingProgress(0);
    setCurrentMessageIndex(0);
    setTotalMessages(0);

    // Mostrar resultado final
    if (failedCount > 0) {
      toast({
        title: "Envío completado con errores",
        description: `${successCount} mensajes enviados, ${failedCount} fallaron. Los enlaces se copiaron al portapapeles como respaldo.`,
        variant: "destructive",
      });
      
      // Copiar todos los enlaces como respaldo
      const allLinks = messages.map(m => m.url);
      await copyLinksToClipboard(allLinks);
    } else {
      toast({
        title: "Mensajes enviados exitosamente",
        description: `Se abrieron ${successCount} chats de WhatsApp`,
      });
    }
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

  const confirmAndSendMessages = async () => {
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

    // Preparar mensajes para envío secuencial
    const messages = filteredClients
      .filter(client => client.phone)
      .map(client => {
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
        
        const cleanPhone = formatPhoneNumber(client.phone);
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedMessage)}`;
        
        return {
          client,
          message: personalizedMessage,
          url: whatsappUrl
        };
      });

    if (messages.length === 0) {
      toast({
        title: "No hay números válidos",
        description: "No se encontraron clientes con números de teléfono válidos",
        variant: "destructive",
      });
      return;
    }

    // Enviar mensajes de forma secuencial
    await sendMessagesSequentially(messages);

    setIsTemplateDialogOpen(false);
    setCurrentTemplate("");
  };

  const sendCustomMessage = async () => {
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

    // Preparar mensajes para envío secuencial
    const messages = filteredClients
      .filter(client => client.phone)
      .map(client => {
        const personalizedMessage = customMessage.replace(/\{nombre\}/g, client.name);
        const cleanPhone = formatPhoneNumber(client.phone);
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedMessage)}`;
        
        return {
          client,
          message: personalizedMessage,
          url: whatsappUrl
        };
      });

    if (messages.length === 0) {
      toast({
        title: "No hay números válidos",
        description: "No se encontraron clientes con números de teléfono válidos",
        variant: "destructive",
      });
      return;
    }

    // Enviar mensajes de forma secuencial
    await sendMessagesSequentially(messages);

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
              disabled={isSending}
            />
            
            {isSending && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Enviando mensajes... ({currentMessageIndex} de {totalMessages})
                  </span>
                </div>
                <Progress value={sendingProgress} className="w-full" />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={confirmAndSendMessages} 
                className="flex-1" 
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Confirmar y enviar mensajes"
                )}
              </Button>
              <Button 
                variant="outline" 
                disabled={isSending}
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
              <Button 
                variant="outline" 
                onClick={() => setIsTemplateDialogOpen(false)}
                disabled={isSending}
              >
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
              disabled={isSending}
            />
            
            {isSending && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Enviando mensajes... ({currentMessageIndex} de {totalMessages})
                  </span>
                </div>
                <Progress value={sendingProgress} className="w-full" />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={sendCustomMessage} 
                className="flex-1"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar mensajes"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCustomMessageDialogOpen(false)}
                disabled={isSending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
