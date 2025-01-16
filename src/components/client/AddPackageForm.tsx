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
import { toast } from "@/hooks/use-toast";

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
  },
  personalizado: {
    name: "Paquete Personalizado",
    totalPublications: "",
  }
} as const;

const packageFormSchema = z.object({
  packageType: z.enum(["basico", "avanzado", "premium", "personalizado"]),
  month: z.string().min(1, "Selecciona el mes del paquete"),
  paid: z.boolean().default(false),
  customPublications: z.string().optional(),
});

export type PackageFormValues = z.infer<typeof packageFormSchema>;

interface AddPackageFormProps {
  onSubmit: (values: PackageFormValues & { name: string, totalPublications: string }) => void;
  defaultValues?: Partial<PackageFormValues>;
  isSubmitting?: boolean;
}

export const AddPackageForm = ({ onSubmit, defaultValues, isSubmitting = false }: AddPackageFormProps) => {
  const [selectedType, setSelectedType] = useState<keyof typeof PACKAGE_TYPES>(
    defaultValues?.packageType || "basico"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  
  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      packageType: defaultValues?.packageType || "basico",
      month: defaultValues?.month || "",
      paid: defaultValues?.paid || false,
      customPublications: defaultValues?.customPublications || "",
    },
  });

  const handleSubmit = async (values: PackageFormValues) => {
    if (isProcessing || isSubmitting) return;
    
    try {
      setIsProcessing(true);
      const packageInfo = PACKAGE_TYPES[values.packageType];
      const totalPublications = values.packageType === "personalizado" 
        ? values.customPublications || "0"
        : packageInfo.totalPublications;
        
      await onSubmit({
        ...values,
        name: values.packageType === "personalizado" 
          ? `Paquete Personalizado (${totalPublications} publicaciones)`
          : packageInfo.name,
        totalPublications,
      });

      form.reset(form.getValues());
    } catch (error) {
      console.error('Error al procesar el paquete:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el paquete. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const disabled = isSubmitting || isProcessing;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="packageType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Tipo de Paquete</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PACKAGE_TYPES).map(([type, info]) => (
                  <Button
                    key={type}
                    type="button"
                    variant={field.value === type ? "default" : "outline"}
                    onClick={() => {
                      if (!disabled) {
                        field.onChange(type);
                        setSelectedType(type as keyof typeof PACKAGE_TYPES);
                      }
                    }}
                    className="w-full"
                    disabled={disabled}
                  >
                    {info.name.split(" ")[1]}
                  </Button>
                ))}
              </div>
              {selectedType !== "personalizado" && (
                <FormDescription>
                  {PACKAGE_TYPES[selectedType].totalPublications} publicaciones por mes
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedType === "personalizado" && (
          <FormField
            control={form.control}
            name="customPublications"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Número de Publicaciones</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="Ej: 20" 
                    {...field}
                    className="rounded-xl bg-white/70 backdrop-blur-sm border-gray-100"
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
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
                  disabled={disabled}
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
                  disabled={disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-black hover:bg-gray-900 text-white rounded-2xl py-6 shadow-lg hover:shadow-xl transition-all duration-300"
          disabled={disabled}
        >
          {disabled ? 'Procesando...' : defaultValues ? 'Actualizar Paquete' : 'Agregar Paquete'}
        </Button>
      </form>
    </Form>
  );
};