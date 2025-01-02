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

interface AddPackageDialogProps {
  clientId: string;
  onAddPackage: (clientId: string, packageData: any) => void;
}

export const AddPackageDialog = ({ clientId, onAddPackage }: AddPackageDialogProps) => {
  const handleSubmit = (values: any) => {
    onAddPackage(clientId, {
      id: crypto.randomUUID(),
      name: values.name,
      totalPublications: parseInt(values.totalPublications),
      usedPublications: 0,
      month: values.month,
      paid: values.paid,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Plus className="h-4 w-4" />
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