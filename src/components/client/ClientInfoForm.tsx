import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ClientInfo } from "../types/client";

const formSchema = z.object({
  generalInfo: z.string().optional(),
});

interface ClientInfoFormProps {
  onSubmit: (values: ClientInfo) => void;
  defaultValues?: ClientInfo;
  isSubmitting?: boolean;
}

export const ClientInfoForm = ({
  onSubmit,
  defaultValues,
  isSubmitting = false,
}: ClientInfoFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generalInfo: defaultValues?.generalInfo || "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const clientInfo: ClientInfo = {
      generalInfo: values.generalInfo || "",
      meetings: defaultValues?.meetings || [],
      socialNetworks: defaultValues?.socialNetworks || []
    };
    onSubmit(clientInfo);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="generalInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Información General</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ingrese información general del cliente..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </form>
    </Form>
  );
};