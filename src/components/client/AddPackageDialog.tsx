
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

interface AddPackageDialogProps {
  clientId: string;
  onAddPackage: (clientId: string, packageData: any) => void;
}

export const AddPackageDialog = ({ clientId, onAddPackage }: AddPackageDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      await onAddPackage(clientId, {
        id: crypto.randomUUID(),
        name: values.name,
        totalPublications: parseInt(values.totalPublications),
        usedPublications: 0,
        month: values.month,
        paid: values.paid,
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding package:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(newOpen) => {
      // Don't allow state changes while submitting
      if (!isSubmitting) {
        setIsOpen(newOpen);
      }
    }}>
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
