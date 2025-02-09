
import { useState, useCallback, useEffect } from "react";
import { Calendar as CalendarIcon, Link as LinkIcon, Plus, Trash2, ExternalLink, Instagram } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

interface PublicationDialogProps {
  publication: any;
  client?: any;
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
  const [type, setType] = useState(publication.type);
  const [description, setDescription] = useState(publication.description || "");
  const [copywriting, setCopywriting] = useState(publication.copywriting || "");
  const [designer, setDesigner] = useState(publication.designer || "no_designer");
  const [status, setStatus] = useState(
    publication.needs_recording ? 'needs_recording' :
    publication.needs_editing ? 'needs_editing' :
    publication.in_editing ? 'in_editing' :
    publication.in_review ? 'in_review' :
    publication.approved ? 'approved' :
    publication.is_published ? 'published' : 'needs_recording'
  );
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(publication.date));
  const dialogId = `publication-dialog-${publication.id}`;

  // Restore the user role query
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

  useEffect(() => {
    if (open) {
      localStorage.setItem(dialogId, 'open');
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === dialogId) {
        const shouldBeOpen = e.newValue === 'open';
        onOpenChange(shouldBeOpen);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (localStorage.getItem(dialogId) === 'open') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!open) {
        localStorage.removeItem(dialogId);
      }
    };
  }, [dialogId, open, onOpenChange]);

  const hasChanges = useCallback(() => {
    return name !== publication.name ||
      type !== publication.type ||
      description !== (publication.description || "") ||
      copywriting !== (publication.copywriting || "") ||
      designer !== (publication.designer || "no_designer") ||
      status !== (
        publication.needs_recording ? 'needs_recording' :
        publication.needs_editing ? 'needs_editing' :
        publication.in_editing ? 'in_editing' :
        publication.in_review ? 'in_review' :
        publication.approved ? 'approved' :
        publication.is_published ? 'published' : 'needs_recording'
      ) ||
      JSON.stringify(links) !== (publication.links || "[]");
  }, [name, type, description, copywriting, designer, status, links, publication]);

  const handleOpenChange = (newOpenState: boolean) => {
    if (!newOpenState && hasChanges()) {
      setShowConfirmDialog(true);
    } else {
      localStorage.setItem(dialogId, newOpenState ? 'open' : 'closed');
      onOpenChange(newOpenState);
    }
  };

  const handleClose = () => {
    if (hasChanges()) {
      setShowConfirmDialog(true);
    } else {
      localStorage.removeItem(dialogId);
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    setName(publication.name);
    setType(publication.type as 'reel' | 'carousel' | 'image');
    setDescription(publication.description || "");
    setCopywriting(publication.copywriting || "");
    setDesigner(publication.designer || "no_designer");
    setStatus(
      publication.needs_recording ? 'needs_recording' :
      publication.needs_editing ? 'needs_editing' :
      publication.in_editing ? 'in_editing' :
      publication.in_review ? 'in_review' :
      publication.approved ? 'approved' :
      publication.is_published ? 'published' : 'needs_recording'
    );
    setSelectedDate(new Date(publication.date));
    setLinks(() => {
      if (!publication.links) return [];
      try {
        return JSON.parse(publication.links);
      } catch (e) {
        console.error('Error parsing links:', e);
        return [];
      }
    });
    setShowConfirmDialog(false);
    localStorage.removeItem(dialogId);
    onOpenChange(false);
  };

  const handleAddLink = () => {
    if (newLinkLabel && newLinkUrl) {
      setLinks([...links, { label: newLinkLabel, url: newLinkUrl }]);
      setNewLinkLabel("");
      setNewLinkUrl("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updates: any = {};
      
      if (isDesigner) {
        updates.needs_recording = status === 'needs_recording';
        updates.needs_editing = status === 'needs_editing';
        updates.in_editing = status === 'in_editing';
        updates.in_review = status === 'in_review';
        updates.approved = status === 'approved';
        updates.is_published = status === 'published';
      } else {
        updates.name = name;
        updates.type = type;
        updates.description = description;
        updates.copywriting = copywriting;
        updates.designer = designer === "no_designer" ? null : designer;
        updates.links = JSON.stringify(links);
        updates.date = selectedDate.toISOString();
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

      localStorage.removeItem(dialogId);
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
    <>
      <Dialog 
        open={open} 
        onOpenChange={handleOpenChange}
      >
        <DialogContent 
          className="max-w-[600px] max-h-[80vh]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            if (hasChanges()) {
              e.preventDefault();
              setShowConfirmDialog(true);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Editar Publicación</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(80vh-120px)] pr-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {client && (
                <div className="space-y-2 mb-4 border-b pb-4">
                  {client.clientInfo?.branding && (
                    <a 
                      href={client.clientInfo.branding}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span className="truncate">Branding</span>
                    </a>
                  )}
                  {client.instagram && (
                    <a 
                      href={`https://instagram.com/${client.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300"
                    >
                      <Instagram className="h-4 w-4" />
                      <span className="truncate">@{client.instagram}</span>
                    </a>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la publicación</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isDesigner}
                  readOnly={isDesigner}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de contenido</Label>
                  <Select 
                    value={type} 
                    onValueChange={(value: 'reel' | 'carousel' | 'image') => setType(value)}
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
                  <Select 
                    value={designer} 
                    onValueChange={setDesigner}
                    disabled={isDesigner}
                  >
                    <SelectTrigger>
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

              <div className="space-y-2">
                <Label>Fecha de publicación</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={es}
                  disabled={isDesigner}
                  className="rounded-md border"
                />
                <div className="text-sm text-muted-foreground">
                  Fecha seleccionada: {format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Links</Label>
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {!isDesigner && (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Etiqueta"
                            value={newLinkLabel}
                            onChange={(e) => setNewLinkLabel(e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="URL"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddLink}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <ScrollArea className="h-[100px]">
                      <div className="space-y-2">
                        {links.map((link, index) => (
                          <div key={index} className="flex items-center gap-2 bg-secondary p-2 rounded">
                            {!isDesigner && (
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
                            )}
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
                <textarea
                  id="copywriting"
                  value={copywriting}
                  onChange={(e) => setCopywriting(e.target.value)}
                  className="w-full min-h-[150px] p-2 border rounded"
                  disabled={isDesigner}
                  readOnly={isDesigner}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[200px] p-2 border rounded"
                  disabled={isDesigner}
                  readOnly={isDesigner}
                />
              </div>

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
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                >
                  Cerrar
                </Button>
                <Button type="submit">
                  Guardar cambios
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Guardar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Has realizado cambios en esta publicación. ¿Quieres guardarlos antes de salir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardChanges}>
              Descartar cambios
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
              handleSubmit(fakeEvent);
              setShowConfirmDialog(false);
            }}>
              Guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

