import { MessageSquare, Settings } from "lucide-react";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageTemplatesDialog } from "./MessageTemplatesDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  name: string;
  phone: string;
  paymentDay: number;
  packages: any[];
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  description: string | null;
  category: string;
}

interface BulkMessageButtonProps {
  clients: Client[];
  selectedPaymentDay?: number;
  searchQuery?: string;
  showPendingPayments?: boolean;
  selectedClientIds?: string[];
}

const processTemplate = (template: string, client: Client) => {
  const paymentDay = client.paymentDay || 1;
  const reminderStart = format(addDays(new Date(new Date().getFullYear(), new Date().getMonth(), paymentDay), -5), "d", { locale: es });
  
  return template
    .replace(/\{nombre\}/g, client.name)
    .replace(/\{dia_pago\}/g, String(paymentDay))
    .replace(/\{plazo_inicio\}/g, reminderStart);
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
  const [isTemplatesManagerOpen, setIsTemplatesManagerOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("message_templates")
      .select("id, name, content, description, category")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (!error && data) {
      setTemplates(data);
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

  const sendMessagesWithTemplate = (template: MessageTemplate) => {
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
        const message = processTemplate(template.content, client);
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
        const message = processTemplate(customMessage, client);
        const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
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

  const handleSelectTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setCustomMessage(template.content);
    setIsTemplateDialogOpen(false);
    setIsCustomMessageDialogOpen(true);
  };

  const getCategoryLabel = (value: string) => {
    const labels: Record<string, string> = {
      pago: "Pagos",
      valores: "Valores",
      general: "General",
      promocion: "Promociones",
      seguimiento: "Seguimiento",
    };
    return labels[value] || value;
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, MessageTemplate[]>);

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
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setIsTemplateDialogOpen(true)}>
            Usar plantilla
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            setSelectedTemplate(null);
            setCustomMessage("");
            setIsCustomMessageDialogOpen(true);
          }}>
            Mensaje personalizado
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {
            setIsTemplatesManagerOpen(true);
            fetchTemplates();
          }}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar plantillas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Diálogo de selección de plantilla */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Seleccionar plantilla</DialogTitle>
            <DialogDescription>
              Elige una plantilla para enviar mensajes a los clientes filtrados.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4">
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    {getCategoryLabel(category)}
                  </h4>
                  <div className="space-y-2">
                    {categoryTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 rounded-lg border hover:border-primary cursor-pointer transition-colors"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {template.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay plantillas configuradas.
                  <br />
                  <Button
                    variant="link"
                    onClick={() => {
                      setIsTemplateDialogOpen(false);
                      setIsTemplatesManagerOpen(true);
                    }}
                  >
                    Crear una plantilla
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Diálogo de mensaje personalizado */}
      <Dialog open={isCustomMessageDialogOpen} onOpenChange={setIsCustomMessageDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? `Plantilla: ${selectedTemplate.name}` : "Mensaje personalizado"}
            </DialogTitle>
            <DialogDescription>
              Usa las siguientes variables: <code className="bg-muted px-1 rounded">{"{nombre}"}</code>,{" "}
              <code className="bg-muted px-1 rounded">{"{dia_pago}"}</code>,{" "}
              <code className="bg-muted px-1 rounded">{"{plazo_inicio}"}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTemplate && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getCategoryLabel(selectedTemplate.category)}</Badge>
                <span className="text-sm text-muted-foreground">
                  Puedes editar el mensaje antes de enviarlo
                </span>
              </div>
            )}
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="min-h-[250px] font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setIsCustomMessageDialogOpen(false);
                setIsTemplateDialogOpen(true);
              }}>
                Cambiar plantilla
              </Button>
              <Button onClick={sendCustomMessage} className="flex-1">
                Enviar mensajes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de gestión de plantillas */}
      <MessageTemplatesDialog
        open={isTemplatesManagerOpen}
        onOpenChange={(open) => {
          setIsTemplatesManagerOpen(open);
          if (!open) fetchTemplates();
        }}
      />
    </>
  );
};