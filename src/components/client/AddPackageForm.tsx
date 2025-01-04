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
import { Button } from "@/components/ui/button";
import { useState } from "react";

const PACKAGE_TYPES = {
  basico: {
    name: "Paquete Básico",
    totalPublications: "8",
  },
  avanzado: {
    name: "Paquete Avanzado",
    totalPublications: "12",
  },
  premium: {
    name: "Paquete Premium",
    totalPublications: "16",
  }
} as const;

const packageFormSchema = z.object({
  packageType: z.enum(["basico", "avanzado", "premium"]),
  month: z.string().min(1, "Selecciona el mes del paquete"),
  paid: z.boolean().default(false),
});

export type PackageFormValues = z.infer<typeof packageFormSchema>;

interface AddPackageFormProps {
  onSubmit: (values: PackageFormValues & { name: string, totalPublications: string }) => void;
  defaultValues?: Partial<PackageFormValues>;
  isSubmitting?: boolean;
}

export const AddPackageForm = ({ onSubmit, defaultValues, isSubmitting }: AddPackageFormProps) => {
  const [selectedType, setSelectedType] = useState<keyof typeof PACKAGE_TYPES>(
    defaultValues?.packageType || "basico"
  );
  
  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: defaultValues || {
      packageType: "basico",
      month: "",
      paid: false,
    },
  });

  const handleSubmit = (values: PackageFormValues) => {
    const packageInfo = PACKAGE_TYPES[values.packageType];
    onSubmit({
      ...values,
      name: packageInfo.name,
      totalPublications: packageInfo.totalPublications,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="packageType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Tipo de Paquete</FormLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={field.value === "basico" ? "default" : "outline"}
                  onClick={() => {
                    field.onChange("basico");
                    setSelectedType("basico");
                  }}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Básico
                </Button>
                <Button
                  type="button"
                  variant={field.value === "avanzado" ? "default" : "outline"}
                  onClick={() => {
                    field.onChange("avanzado");
                    setSelectedType("avanzado");
                  }}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Avanzado
                </Button>
                <Button
                  type="button"
                  variant={field.value === "premium" ? "default" : "outline"}
                  onClick={() => {
                    field.onChange("premium");
                    setSelectedType("premium");
                  }}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Premium
                </Button>
              </div>
              <FormDescription>
                {PACKAGE_TYPES[selectedType].totalPublications} publicaciones por mes
              </FormDescription>
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-black hover:bg-gray-900 text-white rounded-2xl py-6 shadow-lg hover:shadow-xl transition-all duration-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : defaultValues ? 'Actualizar Paquete' : 'Agregar Paquete'}
        </Button>
      </form>
    </Form>
  );
};