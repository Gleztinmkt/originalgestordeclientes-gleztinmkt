import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Link as LinkIcon, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type PublicationType = "reel" | "carousel" | "image";

interface PublicationDialogProps {
  publication: Publication;
  client?: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onDelete?: () => void;
  designers?: any[];
}

export const PublicationDialog = ({ 
  publication, 
  client,
  open, 
  onOpenChange, 
  onUpdate,
  onDelete,
  designers = []
}: PublicationDialogProps) => {
  const [name, setName] = useState(publication.name);
  const [type, setType] = useState<PublicationType>(publication.type as PublicationType);
  const [description, setDescription] = useState(publication.description || "");
  const [copywriting, setCopywriting] = useState(publication.copywriting || "");
  const [designer, setDesigner] = useState(publication.designer || "no_designer");
  const [status, setStatus] = useState(publication.status || "needs_recording");
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>(() => {
    if (!publication.links) return [];
    try {
      return JSON.parse(publication.links);
    } catch (e) {
      console.error('Error parsing links:', e);
      return [];
    }
  });
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Fetch user role
  const { data: userRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      return roleData?.role || null;
    },
  });

  const isDesigner = userRole === 'designer';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updates: any = {};
      
      // Designers can only update status-related fields
      if (isDesigner) {
        updates.needs_recording = status === 'needs_recording';
        updates.needs_editing = status === 'needs_editing';
        updates.in_editing = status === 'in_editing';
        updates.in_review = status === 'in_review';
        updates.approved = status === 'approved';
        updates.is_published = status === 'published';
      } else {
        // Admins can update all fields
        updates.name = name;
        updates.type = type;
        updates.description = description;
        updates.copywriting = copywriting;
        updates.designer = designer === "no_designer" ? null : designer;
        updates.links = JSON.stringify(links);
        updates.needs_recording = status === 'needs_recording';
        updates.needs_editing = status === 'needs_editing';
        updates.in_editing = status === 'in_editing';
        updates.in_review = status === 'in_review';
        updates.approved = status === 'approved';
        updates.is_published = status === 'published';
      }

      const { error } = await supabase
        .from('publications')
        .update(updates)
        .eq('id', publication.id);

      if (error) throw error;

      toast({
        title: "Publicación actualizada",
        description: "Los cambios han sido guardados correctamente.",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating publication:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la publicación. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Editar Publicación</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(80vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la publicación</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isDesigner}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo de contenido</Label>
                <Select 
                  value={type} 
                  onValueChange={(value: PublicationType) => setType(value)}
                  disabled={isDesigner}
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

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select 
                  value={status} 
                  onValueChange={setStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="needs_recording">Falta grabar</SelectItem>
                    <SelectItem value="needs_editing">Falta editar</SelectItem>
                    <SelectItem value="in_editing">En edición</SelectItem>
                    <SelectItem value="in_review">En revisión</SelectItem>
                    <SelectItem value="approved">Aprobado</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Diseñador asignado</Label>
                <div className="flex gap-2">
                  <Select 
                    value={designer} 
                    onValueChange={setDesigner}
                    disabled={isDesigner}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar diseñador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_designer">Sin diseñador</SelectItem>
                      {designers.map((d) => (
                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {!isDesigner && (
              <>
                <div className="space-y-2">
                  <Label>Links</Label>
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Etiqueta del link"
                          value={newLinkLabel}
                          onChange={(e) => setNewLinkLabel(e.target.value)}
                        />
                        <Input
                          placeholder="URL"
                          value={newLinkUrl}
                          onChange={(e) => setNewLinkUrl(e.target.value)}
                        />
                        <Button 
                          type="button" 
                          onClick={() => {
                            if (newLinkUrl && newLinkLabel) {
                              setLinks([...links, { label: newLinkLabel, url: newLinkUrl }]);
                              setNewLinkLabel("");
                              setNewLinkUrl("");
                            }
                          }}
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <ScrollArea className="h-[100px]">
                        <div className="space-y-2">
                          {links.map((link, index) => (
                            <div key={index} className="flex items-center gap-2 bg-secondary p-2 rounded">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newLinks = [...links];
                                  newLinks.splice(index, 1);
                                  setLinks(newLinks);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <span className="flex-1 truncate">{link.label}</span>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="copywriting">Copywriting</Label>
                  <Textarea
                    id="copywriting"
                    value={copywriting}
                    onChange={(e) => setCopywriting(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              {onDelete && !isDesigner && (
                <Button 
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              )}
              <Button type="submit">
                Guardar cambios
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};