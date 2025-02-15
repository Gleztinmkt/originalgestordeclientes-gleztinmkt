
import { useState, useCallback, useEffect } from "react";
import { Trash2, Copy, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import { PublicationHeader } from "./publication-dialog/PublicationHeader";
import { PublicationLinks } from "./publication-dialog/PublicationLinks";
import { StatusSelect } from "./publication-dialog/StatusSelect";
import { DesignerSelect } from "./publication-dialog/DesignerSelect";
import type { PublicationDialogProps, PublicationFormData } from "./publication-dialog/types";

export const PublicationDialog = ({
  publication,
  client,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  designers = []
}: PublicationDialogProps) => {
  const [formData, setFormData] = useState<PublicationFormData>({
    name: publication.name,
    type: publication.type as 'reel' | 'carousel' | 'image',
    description: publication.description || "",
    copywriting: publication.copywriting || "",
    designer: publication.designer || "no_designer",
    status: publication.needs_recording ? 'needs_recording' : 
            publication.needs_editing ? 'needs_editing' : 
            publication.in_editing ? 'in_editing' : 
            publication.in_review ? 'in_review' : 
            publication.approved ? 'approved' : 
            publication.is_published ? 'published' : 'needs_recording',
    date: new Date(publication.date),
    links: publication.links ? JSON.parse(publication.links) : [],
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [copyingCopywriting, setCopyingCopywriting] = useState(false);
  const [copyingDescription, setCopyingDescription] = useState(false);

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
    }
  });

  const isDesigner = userRole === 'designer';

  const hasChanges = useCallback(() => {
    return formData.name !== publication.name || 
           formData.type !== publication.type || 
           formData.description !== (publication.description || "") || 
           formData.copywriting !== (publication.copywriting || "") || 
           formData.designer !== (publication.designer || "no_designer") || 
           formData.status !== (publication.needs_recording ? 'needs_recording' : 
                              publication.needs_editing ? 'needs_editing' : 
                              publication.in_editing ? 'in_editing' : 
                              publication.in_review ? 'in_review' : 
                              publication.approved ? 'approved' : 
                              publication.is_published ? 'published' : 'needs_recording') || 
           JSON.stringify(formData.links) !== (publication.links || "[]");
  }, [formData, publication]);

  const handleOpenChange = (open: boolean) => {
    if (!open && hasChanges()) {
      setShowConfirmDialog(true);
    } else {
      onOpenChange(open);
    }
  };

  const handleClose = () => {
    if (hasChanges()) {
      setShowConfirmDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    setFormData({
      name: publication.name,
      type: publication.type as 'reel' | 'carousel' | 'image',
      description: publication.description || "",
      copywriting: publication.copywriting || "",
      designer: publication.designer || "no_designer",
      status: publication.needs_recording ? 'needs_recording' : 
              publication.needs_editing ? 'needs_editing' : 
              publication.in_editing ? 'in_editing' : 
              publication.in_review ? 'in_review' : 
              publication.approved ? 'approved' : 
              publication.is_published ? 'published' : 'needs_recording',
      date: new Date(publication.date),
      links: publication.links ? JSON.parse(publication.links) : [],
    });
    setShowConfirmDialog(false);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updates: any = {};
      if (isDesigner) {
        updates.needs_recording = formData.status === 'needs_recording';
        updates.needs_editing = formData.status === 'needs_editing';
        updates.in_editing = formData.status === 'in_editing';
        updates.in_review = formData.status === 'in_review';
        updates.approved = formData.status === 'approved';
        updates.is_published = formData.status === 'published';
      } else {
        updates.name = formData.name;
        updates.type = formData.type;
        updates.description = formData.description;
        updates.copywriting = formData.copywriting;
        updates.designer = formData.designer === "no_designer" ? null : formData.designer;
        updates.links = JSON.stringify(formData.links);
        updates.date = formData.date.toISOString();
        updates.needs_recording = formData.status === 'needs_recording';
        updates.needs_editing = formData.status === 'needs_editing';
        updates.in_editing = formData.status === 'in_editing';
        updates.in_review = formData.status === 'in_review';
        updates.approved = formData.status === 'approved';
        updates.is_published = formData.status === 'published';
      }

      const { error } = await supabase
        .from('publications')
        .update(updates)
        .eq('id', publication.id);

      if (error) throw error;

      toast({
        title: "Publicación actualizada",
        description: "Los cambios han sido guardados correctamente."
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating publication:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la publicación. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleCopyText = async (text: string, type: 'copywriting' | 'description') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'copywriting') {
        setCopyingCopywriting(true);
        setTimeout(() => setCopyingCopywriting(false), 2000);
      } else {
        setCopyingDescription(true);
        setTimeout(() => setCopyingDescription(false), 2000);
      }
      toast({
        title: "Texto copiado",
        description: "El texto ha sido copiado al portapapeles."
      });
    } catch (err) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar el texto. Inténtalo manualmente.",
        variant: "destructive"
      });
    }
  };

  const handleVisibilityChange = () => {
    // Do nothing when visibility changes
    return;
  };

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent 
          className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-hidden p-4 sm:p-6" 
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          forceMount={true}
        >
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Editar Publicación</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-120px)] pr-2 sm:pr-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <PublicationHeader client={client} />

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">
                  Nombre de la publicación
                </Label>
                <Input 
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={isDesigner}
                  readOnly={isDesigner}
                  className="w-full text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Tipo de contenido</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: 'reel' | 'carousel' | 'image') => 
                      setFormData(prev => ({ ...prev, type: value }))}
                    disabled={isDesigner}
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="carousel">Carrusel</SelectItem>
                      <SelectItem value="image">Imagen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <StatusSelect 
                  value={formData.status}
                  onChange={value => setFormData(prev => ({ ...prev, status: value }))}
                />

                <DesignerSelect 
                  value={formData.designer}
                  onChange={value => setFormData(prev => ({ ...prev, designer: value }))}
                  designers={designers}
                  disabled={isDesigner}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Fecha de publicación</Label>
                <div className="border rounded-lg p-2 max-h-[250px] overflow-y-auto">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={date => date && setFormData(prev => ({ ...prev, date }))}
                    locale={es}
                    disabled={isDesigner}
                    className="rounded-md border"
                  />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Fecha seleccionada: {format(formData.date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                </div>
              </div>

              <PublicationLinks
                links={formData.links}
                onLinksChange={links => setFormData(prev => ({ ...prev, links }))}
                isDesigner={isDesigner}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="copywriting" className="text-sm sm:text-base">
                    Copywriting
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyText(formData.copywriting, 'copywriting')}
                    className="h-8"
                  >
                    {copyingCopywriting ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Textarea
                  id="copywriting"
                  value={formData.copywriting}
                  onChange={e => setFormData(prev => ({ ...prev, copywriting: e.target.value }))}
                  className="min-h-[150px] touch-manipulation text-sm sm:text-base"
                  disabled={isDesigner}
                  readOnly={isDesigner}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-sm sm:text-base">
                    Descripción
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyText(formData.description, 'description')}
                    className="h-8"
                  >
                    {copyingDescription ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={isDesigner}
                  readOnly={isDesigner}
                  className="min-h-[200px] touch-manipulation text-sm sm:text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                {onDelete && !isDesigner && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onDelete}
                    className="w-full sm:w-auto text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="w-full sm:w-auto text-sm"
                >
                  Cerrar
                </Button>
                <Button type="submit" className="w-full sm:w-auto text-sm">
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
            <AlertDialogCancel
              onClick={handleDiscardChanges}
              className="text-neutral-100 bg-gray-700 hover:bg-gray-600"
            >
              Descartar cambios
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const fakeEvent = {
                  preventDefault: () => {}
                } as React.FormEvent;
                handleSubmit(fakeEvent);
                setShowConfirmDialog(false);
              }}
            >
              Guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
