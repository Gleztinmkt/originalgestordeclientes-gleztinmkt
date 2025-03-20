
import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { BasicClientForm, BasicFormValues } from "./BasicClientForm";
import { ClientInfoForm } from "./ClientInfoForm";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Client, ClientInfo } from "../types/client";

interface EditClientDialogProps {
  client: Client;
  onUpdateClient: (id: string, data: Partial<Client>) => Promise<void>;
  onDeleteClient?: () => void;
}

export const EditClientDialog = ({ client, onUpdateClient, onDeleteClient }: EditClientDialogProps) => {
  const [open, setOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBasicSubmit = useCallback(async (values: BasicFormValues) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const updateData = {
        name: values.name,
        phone: values.phone,
        paymentDay: values.nextPayment,
      };
      
      await onUpdateClient(client.id, updateData);
      
      toast({
        title: "Cliente actualizado",
        description: "La información básica del cliente se ha actualizado correctamente.",
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [client.id, onUpdateClient, isSubmitting]);

  const handleClientInfoSubmit = useCallback(async (values: ClientInfo) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Create a new object for the update to ensure immutability
      const updateData = {
        clientInfo: { ...values }
      };
      
      await onUpdateClient(client.id, updateData);
      
      toast({
        title: "Cliente actualizado",
        description: "La información adicional se ha actualizado correctamente.",
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [client.id, onUpdateClient, isSubmitting]);

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (onDeleteClient && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onDeleteClient();
        setOpen(false);
      } catch (error) {
        console.error('Error deleting client:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        // Don't allow state changes while submitting
        if (!isSubmitting) {
          setOpen(newOpen);
        }
      }}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente: {client.name}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Información Básica</TabsTrigger>
              <TabsTrigger value="additional">Información Adicional</TabsTrigger>
            </TabsList>
            <TabsContent value="basic">
              <BasicClientForm
                onSubmit={handleBasicSubmit}
                defaultValues={{
                  name: client.name,
                  phone: client.phone,
                  nextPayment: client.paymentDay,
                }}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
            <TabsContent value="additional">
              <ClientInfoForm
                onSubmit={handleClientInfoSubmit}
                defaultValues={client.clientInfo}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
          </Tabs>
          
          {onDeleteClient && (
            <DialogFooter className="mt-4 flex items-center">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="flex items-center gap-1"
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar Cliente
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={(newOpen) => {
        // Don't allow state changes while submitting
        if (!isSubmitting) {
          setShowDeleteDialog(newOpen);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente y todos sus datos asociados serán eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-500 hover:bg-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
