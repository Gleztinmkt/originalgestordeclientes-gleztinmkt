import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Publication } from "@/components/client/publication/types";
import { Client } from "@/components/types/client";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PublicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publication?: Publication;
  client?: Client;
  onUpdate?: () => void;
}

interface FormValues {
  name: string;
  type: 'reel' | 'carousel' | 'image';
  date: Date;
  description: string;
  links: string;
}

export const PublicationDialog = ({
  open,
  onOpenChange,
  publication,
  client,
  onUpdate
}: PublicationDialogProps) => {
  const form = useForm<FormValues>({
    defaultValues: {
      name: publication?.name || "",
      type: publication?.type as 'reel' | 'carousel' | 'image' || "image",
      date: publication?.date ? new Date(publication.date) : new Date(),
      description: publication?.description || "",
      links: publication?.links || getAutoLinks()
    }
  });

  const getAutoLinks = () => {
    const links: string[] = [];
    
    if (client?.instagram) {
      links.push(`Instagram: ${client.instagram}`);
    }
    
    if (client?.clientInfo?.branding) {
      links.push(`Branding: ${client.clientInfo.branding}`);
    }
    
    return links.join('\n');
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase
        .from('publications')
        .update({
          name: values.name,
          type: values.type,
          date: values.date.toISOString(),
          description: values.description,
          links: values.links
        })
        .eq('id', publication?.id);

      if (error) throw error;

      toast({
        title: "Publicación actualizada",
        description: "Los cambios han sido guardados correctamente.",
      });

      onUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating publication:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la publicación.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Publicación</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="carousel">Carrusel</SelectItem>
                      <SelectItem value="image">Imagen</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={es}
                      className="rounded-md border"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="links"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Links</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {client?.instagram && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Instagram: {client.instagram}
                        </div>
                      )}
                      {client?.clientInfo?.branding && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Branding: {client.clientInfo.branding}
                        </div>
                      )}
                      <Textarea
                        {...field}
                        placeholder="Enlaces adicionales..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit">Guardar cambios</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};