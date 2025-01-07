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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2 } from "lucide-react";

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
  defaultValues = {
    generalInfo: "",
    meetings: [],
    socialNetworks: []
  },
  isSubmitting = false,
}: ClientInfoFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generalInfo: defaultValues.generalInfo,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const clientInfo: ClientInfo = {
      generalInfo: values.generalInfo || "",
      meetings: defaultValues.meetings || [],
      socialNetworks: defaultValues.socialNetworks || [],
    };
    onSubmit(clientInfo);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Reuniones</h3>
          <ScrollArea className="h-[200px] rounded-md border p-4">
            {defaultValues.meetings && defaultValues.meetings.length > 0 ? (
              <div className="space-y-4">
                {defaultValues.meetings.map((meeting, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {format(new Date(meeting.date), "PPP", { locale: es })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">{meeting.notes}</p>
                    <Separator className="my-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay reuniones registradas</p>
            )}
          </ScrollArea>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </form>
    </Form>
  );
};