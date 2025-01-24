import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { es } from "date-fns/locale";
import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Form } from "@/components/ui/form";

interface PublicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publication: Publication;
  client?: Client;
  onUpdate: () => void;
  designers?: any[];
}

export const PublicationDialog = ({
  open,
  onOpenChange,
  publication,
  client,
  onUpdate,
  designers = []
}: PublicationDialogProps) => {
  const [name, setName] = useState(publication.name);
  const [type, setType] = useState(publication.type);
  const [date, setDate] = useState<Date>(new Date(publication.date));
  const [description, setDescription] = useState(publication.description || "");
  const [links, setLinks] = useState(publication.links || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función para obtener los links automáticos del cliente
  const getAutoLinks = () => {
    if (!client?.clientInfo) return "";
    
    let autoLinks = [];
    
    // Añadir Instagram si existe
    const instagramNetwork = client.clientInfo.socialNetworks?.find(
      network => network.platform === 'instagram' && network.username
    );
    if (instagramNetwork?.username) {
      autoLinks.push(`instagram: ${instagramNetwork.username}`);
    }
    
    // Añadir branding si existe
    if (client.clientInfo.branding) {
      autoLinks.push(`branding: ${client.clientInfo.branding}`);
    }
    
    return autoLinks.join('\n');
  };

  useEffect(() => {
    // Combinar links automáticos con los links existentes que no sean automáticos
    const autoLinks = getAutoLinks();
    const existingCustomLinks = (publication.links || "")
      .split('\n')
      .filter(link => !link.startsWith('instagram:') && !link.startsWith('branding:'))
      .join('\n');
    
    const combinedLinks = [autoLinks, existingCustomLinks]
      .filter(Boolean)
      .join('\n')
      .trim();
    
    setLinks(combinedLinks);
  }, [client, publication]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('publications')
        .update({
          name,
          type,
          date: date.toISOString(),
          description,
          links
        })
        .eq('id', publication.id);

      if (error) throw error;

      toast({
        title: "Publicación actualizada",
        description: "La publicación ha sido actualizada correctamente.",
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating publication:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la publicación. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Publicación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reel">Reel</SelectItem>
                <SelectItem value="carousel">Carrusel</SelectItem>
                <SelectItem value="image">Imagen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fecha</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={es}
            />
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="links">Links</Label>
            <Textarea
              id="links"
              value={links}
              onChange={(e) => setLinks(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
