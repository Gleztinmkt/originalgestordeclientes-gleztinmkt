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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const packageFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  totalPublications: z.string().min(1, "Ingrese el número de publicaciones"),
  month: z.string().min(1, "Selecciona el mes del paquete"),
  paid: z.boolean().default(false),
});

export type PackageFormValues = z.infer<typeof packageFormSchema>;

interface AddPackageFormProps {
  onSubmit: (values: PackageFormValues) => void;
}

export const AddPackageForm = ({ onSubmit }: AddPackageFormProps) => {
  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: "",
      totalPublications: "",
      month: "",
      paid: false,
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
              <FormLabel className="text-gray-700">Nombre del Paquete</FormLabel>
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
          name="totalPublications"
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
          name="month"
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
        <FormField
          control={form.control}
          name="paid"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Estado de Pago</FormLabel>
                <FormDescription>
                  ¿El paquete ya está pagado?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <button 
          type="submit" 
          className="w-full bg-black hover:bg-gray-900 text-white rounded-2xl py-6 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Agregar Paquete
        </button>
      </form>
    </Form>
  );
};