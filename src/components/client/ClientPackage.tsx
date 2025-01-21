import { Package, Edit, MoreVertical, Trash, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageCounter } from "./PackageCounter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { AddPackageForm, PackageFormValues } from "./AddPackageForm";
import { toast } from "@/hooks/use-toast";
import { useState, useCallback, useRef, useEffect } from "react";
import { PublicationCalendarDialog } from "./PublicationCalendarDialog";

interface ClientPackageProps {
  packageName: string;
  totalPublications: number;
  usedPublications: number;
  month: string;
  paid: boolean;
  onUpdateUsed: (newCount: number) => void;
  onUpdatePaid: (paid: boolean) => void;
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
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const submissionCountRef = useRef(0);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  const handleEditSubmit = useCallback(async (values: PackageFormValues & { name: string, totalPublications: string }) => {
    const currentSubmissionCount = ++submissionCountRef.current;
    
    // Prevenir múltiples envíos
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

      // Agregar un pequeño delay para asegurar que el estado se actualice
      await new Promise(resolve => setTimeout(resolve, 100));

      await onEditPackage(values);
      
      console.log(`Submission #${currentSubmissionCount} completed successfully`);
      
      // Usar timeout para asegurar que el estado se actualice correctamente
      processingTimeoutRef.current = setTimeout(() => {
        if (currentSubmissionCount === submissionCountRef.current) {
          setIsEditDialogOpen(false);
          setIsProcessing(false);
          toast({
            title: "Paquete actualizado",
            description: "El paquete ha sido actualizado correctamente.",
          });
        }
      }, 300);

    } catch (error) {
      console.error(`Error in submission #${currentSubmissionCount}:`, error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paquete. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }, [onEditPackage, isProcessing]);

  const handleSendCompletionMessage = () => {
    const message = `*Reporte de Paquete - ${clientName}*\n\n*Nombre:* ${packageName}\n*Mes:* ${month}\n*Estado:* Completado\n*Publicaciones:* ${usedPublications}/${totalPublications}\n\n*Gracias por confiar en Gleztin Marketing Digital*`;
    const whatsappUrl = `https://wa.me/${clientId}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const closeEditDialog = () => {
    if (!isProcessing) {
      console.log('Closing edit dialog - not processing');
      setIsEditDialogOpen(false);
    } else {
      console.log('Cannot close dialog - processing in progress');
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
        />
        <div className="flex gap-2 mt-4">
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
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={closeEditDialog}>
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