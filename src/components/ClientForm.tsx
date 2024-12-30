import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  package: z.string().min(1, "Selecciona un paquete"),
  nextPayment: z.string().min(1, "Selecciona una fecha de pago"),
  marketingInfo: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
  onAddClient: (client: FormValues) => void;
}

export const ClientForm = ({ onAddClient }: ClientFormProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      package: "",
      nextPayment: "",
      marketingInfo: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    onAddClient(values);
    form.reset();
    setOpen(false);
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Nombre</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nombre completo" 
                      {...field}
                      className="rounded-xl bg-white/70 backdrop-blur-sm border-gray-100"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="package"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Paquete</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Paquete Básico" 
                      {...field}
                      className="rounded-xl bg-white/70 backdrop-blur-sm border-gray-100"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextPayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Próximo Pago</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      className="rounded-xl bg-white/70 backdrop-blur-sm border-gray-100"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="marketingInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Información de Marketing</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles de la estrategia..."
                      {...field}
                      className="rounded-xl bg-white/70 backdrop-blur-sm border-gray-100 min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full bg-black hover:bg-gray-900 text-white rounded-2xl py-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Guardar Cliente
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};