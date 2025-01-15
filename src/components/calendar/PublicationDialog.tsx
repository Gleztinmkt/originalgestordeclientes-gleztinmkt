import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PublicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publication: Publication;
  client?: Client;
  onUpdate: () => void;
}

export const PublicationDialog = ({
  open,
  onOpenChange,
  publication,
  client,
  onUpdate,
}: PublicationDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    ...publication,
    filming_time: publication.filming_time || '',
    links: publication.links || '',
    copywriting: publication.copywriting || ''
  });

  const { data: designers = [] } = useQuery({
    queryKey: ['designers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('designers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const updateData = {
        designer: formData.designer,
        type: formData.type,
        description: formData.description,
        needs_recording: formData.needs_recording,
        needs_editing: formData.needs_editing,
        in_editing: formData.in_editing,
        in_review: formData.in_review,
        approved: formData.approved,
        is_published: formData.is_published,
        name: formData.name,
        date: formData.date,
        filming_time: formData.filming_time,
        links: formData.links,
        copywriting: formData.copywriting
      };

      const { error } = await supabase
        .from('publications')
        .update(updateData)
        .eq('id', publication.id);

      if (error) throw error;

      toast({
        title: "Publicación actualizada",
        description: "Los cambios se han guardado correctamente.",
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar publicación</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Nombre de la publicación</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Diseñador</Label>
                <Select
                  value={formData.designer || "no_designer"}
                  onValueChange={(value) => setFormData({ ...formData, designer: value === "no_designer" ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar diseñador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_designer">Sin diseñador</SelectItem>
                    {designers.map((designer) => (
                      <SelectItem key={designer.id} value={designer.name}>
                        {designer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de contenido</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'reel' | 'carousel' | 'image') => setFormData({ ...formData, type: value })}
                >
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
            </div>

            <div className="space-y-2">
              <Label>Hora de filmación (opcional)</Label>
              <Input
                type="time"
                value={formData.filming_time}
                onChange={(e) => setFormData({ ...formData, filming_time: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Links (uno por línea)</Label>
              <Textarea
                value={formData.links}
                onChange={(e) => setFormData({ ...formData, links: e.target.value })}
                className="min-h-[100px]"
                placeholder="https://ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Copywriting</Label>
              <Textarea
                value={formData.copywriting}
                onChange={(e) => setFormData({ ...formData, copywriting: e.target.value })}
                className="min-h-[150px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[300px] font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado de la publicación</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.needs_recording}
                      onCheckedChange={(checked) => setFormData({ ...formData, needs_recording: checked })}
                    />
                    <Label>Falta grabar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.needs_editing}
                      onCheckedChange={(checked) => setFormData({ ...formData, needs_editing: checked })}
                    />
                    <Label>Falta editar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.in_editing}
                      onCheckedChange={(checked) => setFormData({ ...formData, in_editing: checked })}
                    />
                    <Label>En edición</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.in_review}
                      onCheckedChange={(checked) => setFormData({ ...formData, in_review: checked })}
                    />
                    <Label>En revisión</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.approved}
                      onCheckedChange={(checked) => setFormData({ ...formData, approved: checked })}
                    />
                    <Label>Aprobado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                    <Label>Publicado</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};