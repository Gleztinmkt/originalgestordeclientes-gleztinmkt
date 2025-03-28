
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddPackageForm } from "./AddPackageForm";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface AddPackageDialogProps {
  clientId: string;
  onAddPackage: (clientId: string, packageData: any) => Promise<void>;
}

export const AddPackageDialog = ({ clientId, onAddPackage }: AddPackageDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      // Create a new object for the package data
      const packageData = {
        id: crypto.randomUUID(),
        name: values.name,
        totalPublications: parseInt(values.totalPublications),
        usedPublications: 0,
        month: values.month,
        paid: values.paid,
        last_update: new Date().toISOString()
      };
      
      await onAddPackage(clientId, packageData);
      setIsOpen(false);
      
      toast({
        title: "Paquete agregado",
        description: "El paquete se ha creado correctamente.",
      });
    } catch (error) {
      console.error('Error adding package:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el paquete. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(newOpen) => {
        // Don't allow state changes while submitting
        if (!isSubmitting) {
          setIsOpen(newOpen);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Paquete</DialogTitle>
        </DialogHeader>
        <AddPackageForm 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};
