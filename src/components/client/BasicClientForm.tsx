import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const basicFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().min(10, "Ingrese un número de teléfono válido"),
  publications: z.string().min(1, "Ingrese el número de publicaciones"),
  nextPayment: z.string().min(1, "Selecciona una fecha de pago"),
  packageMonth: z.string().min(1, "Selecciona el mes del paquete"),
});

export type BasicFormValues = z.infer<typeof basicFormSchema>;

interface BasicClientFormProps {
  onSubmit: (values: BasicFormValues) => void;
  defaultValues?: Partial<BasicFormValues>;
}

export const BasicClientForm = ({ onSubmit, defaultValues }: BasicClientFormProps) => {
  const form = useForm<BasicFormValues>({
    resolver: zodResolver(basicFormSchema),
    defaultValues: defaultValues || {
      name: "",
      phone: "",
      publications: "",
      nextPayment: "",
      packageMonth: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Teléfono</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: +5491112345678" 
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
          name="publications"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Número de Publicaciones</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Ej: 8" 
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
              <FormLabel className="text-gray-700">Día de Pago (1-31)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ej: 15"
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
          name="packageMonth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Mes del Paquete</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: Enero" 
                  {...field}
                  className="rounded-xl bg-white/70 backdrop-blur-sm border-gray-100"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button 
          type="submit" 
          className="w-full bg-black hover:bg-gray-900 text-white rounded-2xl py-6 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {defaultValues ? 'Actualizar Cliente' : 'Guardar Cliente'}
        </button>
      </form>
    </Form>
  );
};