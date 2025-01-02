import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { BasicClientForm } from "./BasicClientForm";
import { SocialMediaForm } from "./SocialMediaForm";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditClientDialogProps {
  client: {
    id: string;
    name: string;
    phone: string;
    paymentDay: number;
    instagram?: string;
    facebook?: string;
    marketingInfo?: string;
  };
  onUpdateClient: (id: string, data: any) => void;
}

export const EditClientDialog = ({ client, onUpdateClient }: EditClientDialogProps) => {
  const handleBasicSubmit = (values: any) => {
    onUpdateClient(client.id, {
      name: values.name,
      phone: values.phone,
      paymentDay: parseInt(values.nextPayment),
    });
    toast({
      title: "Cliente actualizado",
      description: "La información básica del cliente se ha actualizado correctamente.",
    });
  };

  const handleSocialSubmit = (values: any) => {
    onUpdateClient(client.id, values);
    toast({
      title: "Cliente actualizado",
      description: "La información de redes sociales se ha actualizado correctamente.",
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
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Información Básica</TabsTrigger>
            <TabsTrigger value="social">Redes Sociales</TabsTrigger>
          </TabsList>
          <TabsContent value="basic">
            <BasicClientForm
              onSubmit={handleBasicSubmit}
              defaultValues={{
                name: client.name,
                phone: client.phone,
                nextPayment: client.paymentDay.toString(),
              }}
            />
          </TabsContent>
          <TabsContent value="social">
            <SocialMediaForm
              onSubmit={handleSocialSubmit}
              defaultValues={{
                instagram: client.instagram,
                facebook: client.facebook,
                marketingInfo: client.marketingInfo || "",
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};