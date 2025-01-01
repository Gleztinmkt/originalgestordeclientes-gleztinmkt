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
import { Textarea } from "@/components/ui/textarea";

const socialFormSchema = z.object({
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  marketingInfo: z.string(),
});

export type SocialFormValues = z.infer<typeof socialFormSchema>;

interface SocialMediaFormProps {
  onSubmit: (values: SocialFormValues) => void;
  defaultValues?: Partial<SocialFormValues>;
}

export const SocialMediaForm = ({ onSubmit, defaultValues }: SocialMediaFormProps) => {
  const form = useForm<SocialFormValues>({
    resolver: zodResolver(socialFormSchema),
    defaultValues: defaultValues || {
      instagram: "",
      facebook: "",
      marketingInfo: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="instagram"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Instagram</FormLabel>
              <FormControl>
                <Input 
                  placeholder="@usuario" 
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
          name="facebook"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Facebook</FormLabel>
              <FormControl>
                <Input 
                  placeholder="URL de perfil" 
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
              <FormLabel className="text-gray-700">Información Adicional</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalles, notas y otra información relevante..."
                  {...field}
                  className="rounded-xl bg-white/70 backdrop-blur-sm border-gray-100 min-h-[100px]"
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
          Guardar Información Adicional
        </button>
      </form>
    </Form>
  );
};