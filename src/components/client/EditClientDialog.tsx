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
import { useState, useCallback } from "react";

interface EditClientDialogProps {
  client: {
    id: string;
    name: string;
    phone: string;
    paymentDay: number;
    instagram?: string;
    facebook?: string;
    marketingInfo?: string;
    packages: Array<{
      id: string;
      name: string;
      totalPublications: number;
      usedPublications: number;
      month: string;
      paid: boolean;
    }>;
  };
  onUpdateClient: (id: string, data: any) => void;
}

export const EditClientDialog = ({ client, onUpdateClient }: EditClientDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBasicSubmit = useCallback(async (values: any) => {
    try {
      setIsSubmitting(true);
      await onUpdateClient(client.id, {
        ...client, // Keep all existing data
        name: values.name,
        phone: values.phone,
        paymentDay: parseInt(values.nextPayment),
      });
      setOpen(false);
      toast({
        title: "Cliente actualizado",
        description: "La información básica del cliente se ha actualizado correctamente.",
      });
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
  }, [client, onUpdateClient]);

  const handleSocialSubmit = useCallback(async (values: any) => {
    try {
      setIsSubmitting(true);
      await onUpdateClient(client.id, {
        ...client, // Keep all existing data
        instagram: values.instagram,
        facebook: values.facebook,
        marketingInfo: values.marketingInfo,
      });
      setOpen(false);
      toast({
        title: "Cliente actualizado",
        description: "La información de redes sociales se ha actualizado correctamente.",
      });
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
  }, [client, onUpdateClient]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              isSubmitting={isSubmitting}
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
              isSubmitting={isSubmitting}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};