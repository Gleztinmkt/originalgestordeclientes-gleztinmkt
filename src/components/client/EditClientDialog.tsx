import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { SocialMediaForm, SocialFormValues } from "./SocialMediaForm";
import { toast } from "@/hooks/use-toast";

interface EditClientDialogProps {
  client: {
    id: string;
    instagram?: string;
    facebook?: string;
    marketingInfo?: string;
  };
  onUpdateClient: (id: string, data: SocialFormValues) => void;
}

export const EditClientDialog = ({ client, onUpdateClient }: EditClientDialogProps) => {
  const handleSubmit = (values: SocialFormValues) => {
    onUpdateClient(client.id, values);
    toast({
      title: "Cliente actualizado",
      description: "La información del cliente se ha actualizado correctamente.",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Información del Cliente</DialogTitle>
        </DialogHeader>
        <SocialMediaForm
          onSubmit={handleSubmit}
          defaultValues={{
            instagram: client.instagram,
            facebook: client.facebook,
            marketingInfo: client.marketingInfo || "",
          }}
        />
      </DialogContent>
    </Dialog>
  );
};