import { Package, Edit, MoreVertical, Trash } from "lucide-react";
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
} from "@/components/ui/dialog";
import { AddPackageForm, PackageFormValues } from "./AddPackageForm";
import { toast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";

interface ClientPackageProps {
  packageName: string;
  totalPublications: number;
  usedPublications: number;
  month: string;
  paid: boolean;
  onUpdateUsed: (newCount: number) => void;
  onUpdatePaid: (paid: boolean) => void;
  onEditPackage: (values: PackageFormValues) => void;
  onDeletePackage?: () => void;
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
}: ClientPackageProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditSubmit = useCallback(async (values: PackageFormValues) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }, [onEditPackage, isSubmitting]);

  const handleUpdatePaid = useCallback(async (newPaidStatus: boolean) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onUpdatePaid(newPaidStatus);
      toast({
        title: "Estado actualizado",
        description: `El paquete ha sido marcado como ${newPaidStatus ? 'pagado' : 'pendiente'}.`,
      });
    } catch (error) {
      console.error('Error updating paid status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pago.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [onUpdatePaid, isSubmitting]);

  return (
    <Card className="bg-white/60 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Package className="h-5 w-5" />
          {packageName}
        </CardTitle>
        <div className="flex items-center gap-4">
          <Badge>{month}</Badge>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {paid ? "Pagado" : "Pendiente"}
            </span>
            <Switch 
              checked={paid} 
              onCheckedChange={handleUpdatePaid}
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
                disabled={isSubmitting}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar paquete
              </DropdownMenuItem>
              {onDeletePackage && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    onDeletePackage();
                    toast({
                      title: "Paquete eliminado",
                      description: "El paquete ha sido eliminado correctamente.",
                    });
                  }}
                  disabled={isSubmitting}
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
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Paquete</DialogTitle>
          </DialogHeader>
          <AddPackageForm
            onSubmit={handleEditSubmit}
            defaultValues={{
              name: packageName,
              totalPublications: totalPublications.toString(),
              month: month,
              paid: paid,
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};
