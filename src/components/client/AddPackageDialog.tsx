import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { AddPackageForm, PackageFormValues } from "./AddPackageForm";
import { toast } from "@/hooks/use-toast";

interface AddPackageDialogProps {
  clientId: string;
  onAddPackage: (clientId: string, packageData: any) => void;
}

export const AddPackageDialog = ({ clientId, onAddPackage }: AddPackageDialogProps) => {
  const handleSubmit = (values: PackageFormValues) => {
    const newPackage = {
      id: crypto.randomUUID(),
      name: values.name,
      totalPublications: parseInt(values.totalPublications),
      usedPublications: 0,
      month: values.month,
      paid: values.paid,
    };
    
    onAddPackage(clientId, newPackage);
    toast({
      title: "Paquete agregado",
      description: "El nuevo paquete se ha agregado correctamente.",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Package className="h-4 w-4 mr-2" />
          Agregar Paquete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Paquete</DialogTitle>
        </DialogHeader>
        <AddPackageForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
};