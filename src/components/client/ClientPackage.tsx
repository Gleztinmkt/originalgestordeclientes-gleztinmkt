import { useState, useCallback, useRef, useEffect } from "react";
import { Package, Edit, MoreVertical, Trash, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageCounter } from "./PackageCounter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Json } from "@/integrations/supabase/types";
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
import { PublicationCalendarDialog } from "./PublicationCalendarDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PackageData {
  id: string;
  name: string;
  totalPublications: number;
  usedPublications: number;
  month: string;
  paid: boolean;
  last_update?: string;
}

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

  // Fetch package data including last_update
  const { data: packageData } = useQuery({
    queryKey: ['package', clientId, packageId],
    queryFn: async () => {
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('packages')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      let packages: PackageData[] = [];
      if (typeof clientData?.packages === 'string') {
        packages = JSON.parse(clientData.packages);
      } else if (Array.isArray(clientData?.packages)) {
        packages = clientData.packages as PackageData[];
      }

      return packages.find(pkg => pkg.id === packageId);
    },
  });

  // Fetch next publication
  const { data: nextPublication } = useQuery({
    queryKey: ['nextPublication', clientId, packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .eq('client_id', clientId)
        .eq('package_id', packageId)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    },
  });

  const handleUpdateUsed = async (newCount: number) => {
    try {
      if (newCount > usedPublications) {
        const timestamp = new Date().toISOString();
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('packages')
          .eq('id', clientId)
          .single();

        if (error) throw error;

        let packages: PackageData[] = [];
        if (typeof clientData?.packages === 'string') {
          packages = JSON.parse(clientData.packages);
        } else if (Array.isArray(clientData?.packages)) {
          packages = clientData.packages;
        }

        const updatedPackages = packages.map(pkg =>
          pkg.id === packageId
            ? { ...pkg, last_update: timestamp }
            : pkg
        );

        const { error: updateError } = await supabase
          .from('clients')
          .update({ 
            packages: updatedPackages as unknown as Json[]
          })
          .eq('id', clientId);

        if (updateError) throw updateError;
      }

      await onUpdateUsed(newCount);
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paquete",
        variant: "destructive",
      });
    }
  };

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
          onUpdateUsed={handleUpdateUsed}
        />
        
        <div className="mt-4 space-y-4">
          {packageData?.last_update && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Últ. Actualización: {format(new Date(packageData.last_update), "dd 'de' MMMM 'a las' HH:mm", { locale: es })}</span>
            </div>
          )}

          {nextPublication && (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Próxima publicación
              </span>
              <Badge variant="secondary" className="w-fit bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400">
                {nextPublication.name}
              </Badge>
            </div>
          )}

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
