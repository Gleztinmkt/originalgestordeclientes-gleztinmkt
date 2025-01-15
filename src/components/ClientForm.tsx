import { useState } from "react";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { BasicClientForm, BasicFormValues } from "./client/BasicClientForm";
import { toast } from "@/hooks/use-toast";

interface ClientFormProps {
  onAddClient: (client: any) => void;
}

export const ClientForm = ({ onAddClient }: ClientFormProps) => {
  const [open, setOpen] = useState(false);

  const onSubmit = (values: BasicFormValues) => {
    console.log('Form values:', values); // Debug log
    const newClient = {
      name: values.name,
      phone: values.phone,
      payment_day: parseInt(values.nextPayment.toString()), // Ensure it's properly parsed as a number
      marketingInfo: "",
      instagram: "",
      facebook: "",
      packages: []
    };
    
    console.log('New client data:', newClient); // Debug log
    onAddClient(newClient);
    setOpen(false);
    toast({
      title: "Cliente agregado",
      description: "El cliente se ha agregado correctamente. Puedes agregar paquetes desde su perfil.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-black hover:bg-gray-900 text-white rounded-2xl py-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <UserPlus className="mr-2 h-5 w-5" />
          Agregar Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-card border-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-semibold text-gray-800">
            Nuevo Cliente
          </DialogTitle>
        </DialogHeader>
        <BasicClientForm onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
};