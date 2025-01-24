import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Publication, PublicationFormValues } from "./types";

interface PublicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publication: Publication;
  client: any; // Replace with actual client type
  onUpdate: () => void;
  onDelete: () => void;
  designers?: any[];
}

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum(['reel', 'carousel', 'image']),
  date: z.date(),
  description: z.string().optional(),
  links: z.string().optional(),
});

export const PublicationDialog = ({ 
  open,
  onOpenChange,
  publication,
  client,
  onUpdate,
  onDelete,
  designers = []
}: PublicationDialogProps) => {
  const [form, setForm] = useState({
    name: publication.name,
    type: publication.type,
    date: new Date(publication.date),
    description: publication.description || "",
    links: publication.links || "",
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const autoLinks = getAutoLinks();
      const combinedLinks = values.links 
        ? `${autoLinks}\n${values.links}` 
        : autoLinks;

      const { error } = await supabase
        .from('publications')
        .update({
          ...values,
          links: combinedLinks,
        })
        .eq('id', publication.id);

      if (error) throw error;

      toast({
        title: "Publicación actualizada",
        description: "Los cambios han sido guardados correctamente.",
      });

      onUpdate();
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

  const getAutoLinks = () => {
    const links: string[] = [];
    
    // Agregar Instagram si existe
    if (client?.instagram) {
      links.push(`Instagram: ${client.instagram}`);
    }
    
    // Agregar Branding si existe
    if (client?.clientInfo?.branding) {
      links.push(`Branding: ${client.clientInfo.branding}`);
    }
    
    return links.join('\n');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Publicación</DialogTitle>
        </DialogHeader>
        <Form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Nombre de la publicación" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                  <select {...field}>
                    <option value="reel">Reel</option>
                    <option value="carousel">Carrusel</option>
                    <option value="image">Imagen</option>
                  </select>
                </FormControl>
                <FormMessage />
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
                  <input type="date" {...field} />
                </FormControl>
                <FormMessage />
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
                  <Textarea {...field} placeholder="Descripción de la publicación" />
                </FormControl>
                <FormMessage />
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
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Guardar</Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
