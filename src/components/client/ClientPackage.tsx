import { useState } from "react";
import { Package, Edit, MoreVertical, Trash, Send, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageCounter } from "./PackageCounter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { html2canvas } from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddPackageForm } from "./AddPackageForm";
import { PublicationCalendarDialog } from "./PublicationCalendarDialog";

interface ClientPackageProps {
  packageName: string;
  totalPublications: number;
  usedPublications: number;
  month: string;
  paid: boolean;
  onUpdateUsed: (newCount: number) => void;
  onUpdatePaid: (paid: boolean) => void;
  onEditPackage: (values: any) => Promise<void>;
  onDeletePackage?: () => void;
  clientId: string;
  clientName: string;
  packageId: string;
  isProcessing: boolean;
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
  isProcessing,
}: ClientPackageProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [lastPost, setLastPost] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");

  useState(() => {
    const fetchClientData = async () => {
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('last_post, phone')
        .eq('id', clientId)
        .single();

      if (!error && clientData) {
        setLastPost(clientData.last_post || "");
        setClientPhone(clientData.phone || "");
      }
    };

    fetchClientData();
  }, [clientId]);

  const handleLastPostChange = async (value: string) => {
    if (isProcessing) return;
    
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

  const handleEditSubmit = async (values: any) => {
    if (isProcessing) return;
    
    try {
      await onEditPackage(values);
      setIsEditDialogOpen(false);
      toast({
        title: "Paquete actualizado",
        description: "El paquete ha sido actualizado correctamente.",
      });
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paquete. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleSendCompletionMessage = () => {
    if (!clientPhone) {
      toast({
        title: "Error",
        description: "El cliente no tiene número de teléfono registrado",
        variant: "destructive",
      });
      return;
    }

    const message = `¡Hola! Este es un mensaje automático.\n\n` +
      `Te informamos que tu paquete "${packageName}" del mes de ${month} ha sido completado. ` +
      `Para continuar con nuestros servicios, te pedimos que nos cuentes con qué paquete te interesaría continuar.\n\n` +
      `Los valores actualizados los vas a encontrar en el siguiente link:\n\n` +
      `https://gleztin.com.ar/index.php/valores-de-redes-sociales/\n` +
      `*Contraseña:* Gleztin (Con mayúscula al inicio)\n\n` +
      `¡Gracias por confiar en nosotros!`;

    const whatsappUrl = `https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDeletePackageClick = () => {
    if (isProcessing) return;
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (isProcessing || !onDeletePackage) return;
    
    try {
      await onDeletePackage();
      setIsDeleteDialogOpen(false);
      toast({
        title: "Paquete eliminado",
        description: "El paquete ha sido eliminado correctamente.",
      });
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el paquete. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const generateCalendarImage = async () => {
    const calendarElement = document.createElement('div');
    calendarElement.className = 'p-8 bg-gradient-to-br from-[#F2FCE2] to-[#E5DEFF] min-w-[800px]';
    
    const header = document.createElement('div');
    header.className = 'text-center mb-8 bg-white/800 backdrop-blur-sm rounded-xl p-6 shadow-lg';
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

      const footer = document.createElement('div');
      footer.className = 'mt-8 text-center p-4 bg-white/800 backdrop-blur-sm rounded-xl';
      footer.innerHTML = `
        <div class="text-sm text-[#8E9196] flex items-center justify-center gap-2">
          <span class="font-medium">Gestor de clientes</span>
          <span class="text-[#9b87f5] font-bold">Gleztin Marketing Digital</span>
        </div>
      `;
      calendarElement.appendChild(footer);

      document.body.appendChild(calendarElement);

      const canvas = await html2canvas(calendarElement, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

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
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isProcessing}>
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
                  onClick={handleDeletePackageClick}
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
          disabled={isProcessing}
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
              disabled={isProcessing}
            />
          </div>

          <div className="flex gap-2">
            {usedPublications === totalPublications && (
              <Button 
                onClick={handleSendCompletionMessage}
                className="w-full gap-2"
                variant="outline"
                disabled={isProcessing}
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

      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          if (!isProcessing) {
            setIsEditDialogOpen(open);
          }
        }}
      >
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
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={isProcessing}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
