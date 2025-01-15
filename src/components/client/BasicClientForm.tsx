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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const basicFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().min(10, "Ingrese un número de teléfono válido"),
  nextPayment: z.coerce.number()
    .min(1, "Ingrese un día válido entre 1 y 31")
    .max(31, "Ingrese un día válido entre 1 y 31"),
});

export type BasicFormValues = z.infer<typeof basicFormSchema>;

interface BasicClientFormProps {
  onSubmit: (values: BasicFormValues) => void;
  defaultValues?: {
    name?: string;
    phone?: string;
    nextPayment?: number;
  };
  isSubmitting?: boolean;
}

export const BasicClientForm = ({ onSubmit, defaultValues, isSubmitting }: BasicClientFormProps) => {
  const form = useForm<BasicFormValues>({
    resolver: zodResolver(basicFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      phone: defaultValues?.phone || "",
      nextPayment: defaultValues?.nextPayment || 1,
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
              <FormLabel className="text-gray-700 dark:text-gray-300">Nombre</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nombre completo" 
                  {...field}
                  className="rounded-xl bg-white/70 backdrop-blur-sm border-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  disabled={isSubmitting}
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
              <FormLabel className="text-gray-700 dark:text-gray-300">Teléfono</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: +5491112345678" 
                  {...field}
                  className="rounded-xl bg-white/70 backdrop-blur-sm border-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  disabled={isSubmitting}
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
              <FormLabel className="text-gray-700 dark:text-gray-300">Día de Pago (1-31)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ej: 15"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  className="rounded-xl bg-white/70 backdrop-blur-sm border-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full bg-black hover:bg-gray-900 text-white rounded-2xl py-6 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-800 dark:hover:bg-gray-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            defaultValues ? 'Actualizar Cliente' : 'Guardar Cliente'
          )}
        </Button>
      </form>
    </Form>
  );
};