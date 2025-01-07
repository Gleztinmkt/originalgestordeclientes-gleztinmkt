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
  meetings: z.array(z.object({
    date: z.string(),
    notes: z.string()
  })).default([]),
  socialNetworks: z.array(z.object({
    platform: z.enum(["instagram", "facebook", "linkedin", "tiktok", "twitter", "youtube"]),
    username: z.string()
  })).default([])
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
  const form = useForm<ClientInfo>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      generalInfo: "",
      meetings: [],
      socialNetworks: []
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="generalInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Información General</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ingresa información general del cliente..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </form>
    </Form>
  );
};