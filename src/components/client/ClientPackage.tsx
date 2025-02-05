import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Edit, MoreVertical, Trash, Send, Download } from "lucide-react";
import { PackageCounter } from "./PackageCounter";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddPackageForm } from "./AddPackageForm";
import { PublicationCalendarDialog } from "./PublicationCalendarDialog";
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';

interface PackageFormValues {
  name: string;
  totalPublications: string;
  month: string;
  paid: boolean;
}

interface PackageData {
  id: string;
  name: string;
  totalPublications: number;
  usedPublications: number;
  month: string;
  paid: boolean;
}

interface ClientPackageProps {
  packageName: string;
  totalPublications: number;
  usedPublications: number;
  month: string;
  paid: boolean;
  onUpdateUsed: (newCount: number) => void;
  onUpdatePaid: (paid: boolean) => Promise<void>;
  onEditPackage: (values: PackageFormValues & { name: string, totalPublications: string }) => Promise<void>;
  onDeletePackage?: () => void;
  clientId: string;
  clientName: string;
  packageId: string;
}

export const ClientPackage = ({
  packageName,
  totalPublications,
  usedPublications,
  month,
  paid,
  onUpdateUsed,
  onUpdatePaid,
  onEditPackage,
  onDeletePackage,
  clientId,
  clientName,
  packageId,
}: ClientPackageProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPost, setLastPost] = useState<string>("");
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const submissionCountRef = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchLastPost = async () => {
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('last_post')
        .eq('id', clientId)
        .single();

      if (!error && clientData) {
        setLastPost(clientData.last_post || "");
      }
    };

    fetchLastPost();
  }, [clientId]);

  const handleLastPostChange = async (value: string) => {
    setLastPost(value);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ last_post: value })
        .eq('id', clientId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating last post:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el último post",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = useCallback(async (values: PackageFormValues & { name: string, totalPublications: string }) => {
    const currentSubmissionCount = ++submissionCountRef.current;
    
    if (isProcessing) {
      console.log('Submission blocked - already processing');
      return;
    }

    console.log(`Starting submission #${currentSubmissionCount}`, {
      values,
      isProcessing,
      currentTime: new Date().toISOString()
    });

    try {
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      await onEditPackage(values);
      
      console.log(`Submission #${currentSubmissionCount} completed successfully`);
      
      if (isMounted.current) {
        processingTimeoutRef.current = setTimeout(() => {
          if (currentSubmissionCount === submissionCountRef.current && isMounted.current) {
            setIsEditDialogOpen(false);
            setIsProcessing(false);
            toast({
              title: "Paquete actualizado",
              description: "El paquete ha sido actualizado correctamente.",
            });
          }
        }, 300);
      }
    } catch (error) {
      console.error(`Error in submission #${currentSubmissionCount}:`, error);
      if (isMounted.current) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el paquete. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    }
  }, [onEditPackage, isProcessing]);

  const handleSendCompletionMessage = async () => {
    try {
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('name, phone')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      if (!clientData?.phone) {
        toast({
          title: "Error",
          description: "El cliente no tiene número de teléfono registrado",
          variant: "destructive",
        });
        return;
      }

      const message = `Hola ${clientData.name}!\n\n` +
        `Te escribimos para informarte que has completado todas las publicaciones del paquete "${packageName}" correspondiente al mes de ${month}.\n\n` +
        `¿Te gustaría renovar el paquete para el próximo mes?\n\n` +
        `Quedamos atentos a tu respuesta.\n\n` +
        `¡Gracias por confiar en nosotros!`;

      const whatsappUrl = `https://wa.me/${clientData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      toast({
        title: "Mensaje enviado",
        description: "Se ha abierto WhatsApp con el mensaje predefinido.",
      });
    } catch (error) {
      console.error('Error sending completion message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje de completado",
        variant: "destructive",
      });
    }
  };

  const generateCalendarImage = async () => {
    const calendarElement = document.createElement('div');
    calendarElement.className = 'p-8 bg-gradient-to-br from-[#F2FCE2] to-[#E5DEFF] min-w-[800px]';
    
    // Header with modern styling and company name
    const header = document.createElement('div');
    header.className = 'text-center mb-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg';
    header.innerHTML = `
      <div class="flex flex-col items-center justify-center gap-2 mb-4">
        <h1 class="text-2xl font-bold text-[#221F26]">Gleztin Marketing Digital - Depto. Marketing</h1>
      </div>
      <h2 class="text-xl text-[#221F26] font-semibold mb-2">${clientName} - ${packageName}</h2>
      <p class="text-[#8E9196]">Generado el ${new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
    `;
    calendarElement.appendChild(header);

    try {
      const { data: publications = [] } = await supabase
        .from('publications')
        .select('*')
        .eq('client_id', clientId)
        .eq('package_id', packageId)
        .is('deleted_at', null)
        .order('date', { ascending: true });

      // Publications list with modern cards
      const list = document.createElement('div');
      list.className = 'space-y-4';
      
      publications.forEach(pub => {
        const item = document.createElement('div');
        item.className = 'bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-md transition-all hover:shadow-lg';
        
        const typeColors = {
          reel: { bg: '#D3E4FD', text: '#0EA5E9' },
          carousel: { bg: '#FDE1D3', text: '#F97316' },
          image: { bg: '#E5DEFF', text: '#8B5CF6' }
        };
        
        const typeColor = typeColors[pub.type as keyof typeof typeColors] || typeColors.image;
        
        item.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-[#221F26] mb-1">${pub.name}</h3>
              <p class="text-[#8E9196] text-sm">
                ${new Date(pub.date).toLocaleDateString('es-ES', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <span class="px-4 py-2 rounded-full text-sm font-medium" style="background-color: ${typeColor.bg}; color: ${typeColor.text}">
              ${pub.type.charAt(0).toUpperCase() + pub.type.slice(1)}
            </span>
          </div>
          ${pub.description ? `
            <div class="mt-3 pt-3 border-t border-gray-100">
              <p class="text-sm text-[#8E9196]">${pub.description}</p>
            </div>
          ` : ''}
        `;
        list.appendChild(item);
      });
      
      calendarElement.appendChild(list);

      // Footer with modern styling
      const footer = document.createElement('div');
      footer.className = 'mt-8 text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl';
      footer.innerHTML = `
        <div class="text-sm text-[#8E9196] flex items-center justify-center gap-2">
          <span class="font-medium">Gestor de clientes</span>
          <span class="text-[#9b87f5] font-bold">Gleztin Marketing Digital</span>
        </div>
      `;
      calendarElement.appendChild(footer);

      // Add to document temporarily
      document.body.appendChild(calendarElement);

      const canvas = await html2canvas(calendarElement, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      // Convert to image and download
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `calendario-${clientName.toLowerCase().replace(/\s+/g, '-')}-${packageName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = image;
      link.click();

      toast({
        title: "Calendario generado",
        description: "La imagen se ha descargado correctamente.",
      });
    } catch (error) {
      console.error('Error generating calendar image:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen del calendario.",
        variant: "destructive",
      });
    } finally {
      // Clean up
      if (document.body.contains(calendarElement)) {
        document.body.removeChild(calendarElement);
      }
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Package className="h-5 w-5" />
          {packageName}
        </CardTitle>
        <div className="flex items-center gap-4">
          <Badge>{month}</Badge>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {paid ? "Pagado" : "Pendiente"}
            </span>
            <Switch 
              checked={paid} 
              onCheckedChange={onUpdatePaid}
              disabled={isProcessing}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setIsEditDialogOpen(true)}
                disabled={isProcessing}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar paquete
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={generateCalendarImage}
                disabled={isProcessing}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar calendario
              </DropdownMenuItem>
              {onDeletePackage && (
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isProcessing}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Eliminar paquete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <PackageCounter
          total={totalPublications}
          used={usedPublications}
          onUpdateUsed={onUpdateUsed}
          onUpdateLastUsed={handleLastPostChange}
        />
        
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lastPost" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Último Post:
            </Label>
            <Input
              id="lastPost"
              value={lastPost}
              onChange={(e) => handleLastPostChange(e.target.value)}
              className="w-full"
              placeholder="Ingrese el último post..."
            />
          </div>

          <div className="flex gap-2">
            {usedPublications === totalPublications && (
              <Button 
                onClick={handleSendCompletionMessage}
                className="w-full gap-2"
                variant="outline"
              >
                <Send className="h-4 w-4" />
                Enviar mensaje de completado
              </Button>
            )}
            <PublicationCalendarDialog 
              clientId={clientId}
              clientName={clientName}
              packageId={packageId}
            />
          </div>
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Paquete</DialogTitle>
            <DialogDescription>
              Actualiza los detalles del paquete aquí.
            </DialogDescription>
          </DialogHeader>
          <AddPackageForm
            onSubmit={handleEditSubmit}
            defaultValues={{
              packageType: "basico",
              month: month,
              paid: paid,
            }}
            isSubmitting={isProcessing}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El paquete será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDeletePackage?.();
                setIsDeleteDialogOpen(false);
              }} 
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
