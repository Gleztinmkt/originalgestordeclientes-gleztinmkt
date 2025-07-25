import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Link as LinkIcon, Plus, Trash2, Copy, Check, Share2 } from "lucide-react";
import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  // Estado interno completamente controlado
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState(publication.name);
  const [type, setType] = useState<'reel' | 'carousel' | 'image'>(publication.type as 'reel' | 'carousel' | 'image');
  const [description, setDescription] = useState(publication.description || "");
  const [copywriting, setCopywriting] = useState(publication.copywriting || "");
  const [designer, setDesigner] = useState(publication.designer || "no_designer");
  const [status, setStatus] = useState(publication.needs_recording ? 'needs_recording' : publication.needs_editing ? 'needs_editing' : publication.in_editing ? 'in_editing' : publication.in_review ? 'in_review' : publication.approved ? 'approved' : publication.is_published ? 'published' : 'needs_recording');
  const [links, setLinks] = useState<Array<{
    label: string;
    url: string;
  }>>(() => {
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
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(publication.date));
  const [copyingCopywriting, setCopyingCopywriting] = useState(false);
  const [copyingDescription, setCopyingDescription] = useState(false);
  
  // Refs para control total
  const dialogRef = useRef<HTMLDivElement>(null);
  const preventCloseRef = useRef(true);

  // Sincronizar estado interno con prop externa
  useEffect(() => {
    console.log('Syncing internal state with prop:', open);
    setInternalOpen(open);
    if (open) {
      preventCloseRef.current = true;
    }
  }, [open]);

  // Prevenir cierre por cualquier evento del navegador
  useEffect(() => {
    if (!internalOpen) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('Before unload prevented');
      e.preventDefault();
      return '';
    };

    const handleVisibilityChange = () => {
      console.log('Visibility change - keeping dialog open');
      if (document.hidden) {
        // El documento se está ocultando, pero mantenemos el diálogo abierto
        setTimeout(() => {
          if (preventCloseRef.current && !internalOpen) {
            console.log('Forcing dialog to reopen after visibility change');
            setInternalOpen(true);
          }
        }, 100);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      console.log('Focus out prevented');
      e.preventDefault();
    };

    const handleBlur = (e: FocusEvent) => {
      console.log('Blur prevented');
      e.preventDefault();
    };

    // Agregar múltiples listeners para capturar todos los eventos posibles
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, [internalOpen]);

  // Monitorear cambios no autorizados del estado del diálogo
  useEffect(() => {
    const interval = setInterval(() => {
      if (preventCloseRef.current && open && !internalOpen) {
        console.log('Detected unauthorized dialog close - reopening');
        setInternalOpen(true);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [open, internalOpen]);

  const handleOpenSocialLinks = () => {
    if (!client?.clientInfo?.socialNetworks) {
      toast({
        title: "Sin redes sociales",
        description: "Este cliente no tiene redes sociales configuradas.",
        variant: "destructive"
      });
      return;
    }
    client.clientInfo.socialNetworks.forEach(network => {
      if (network.username) {
        let url;
        switch (network.platform) {
          case 'instagram':
            url = `https://instagram.com/${network.username}`;
            break;
          case 'facebook':
            url = `https://facebook.com/${network.username}`;
            break;
          case 'tiktok':
            url = `https://tiktok.com/@${network.username}`;
            break;
          case 'linkedin':
            url = `https://linkedin.com/in/${network.username}`;
            break;
          case 'twitter':
            url = `https://twitter.com/${network.username}`;
            break;
          case 'youtube':
            url = `https://youtube.com/@${network.username}`;
            break;
          default:
            return;
        }
        window.open(url, '_blank');
      }
    });
  };

  const {
    data: userRole
  } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return null;
      const {
        data: roleData
      } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
      return roleData?.role || null;
    }
  });

  const isDesigner = userRole === 'designer';
  
  const hasChanges = useCallback(() => {
    return name !== publication.name || type !== publication.type || description !== (publication.description || "") || copywriting !== (publication.copywriting || "") || designer !== (publication.designer || "no_designer") || status !== (publication.needs_recording ? 'needs_recording' : publication.needs_editing ? 'needs_editing' : publication.in_editing ? 'in_editing' : publication.in_review ? 'in_review' : publication.approved ? 'approved' : publication.is_published ? 'published' : 'needs_recording') || JSON.stringify(links) !== (publication.links || "[]");
  }, [name, type, description, copywriting, designer, status, links, publication]);

  // CONTROL ABSOLUTO - Bloquear TODAS las formas de cierre automático
  const handleRadixOpenChange = (requestedOpen: boolean) => {
    console.log('Radix requested open change:', requestedOpen, 'prevented:', preventCloseRef.current);
    
    // Solo permitir si hemos autorizado explícitamente el cierre
    if (!requestedOpen && preventCloseRef.current) {
      console.log('BLOCKING Radix close request');
      // No hacer nada - mantener abierto forzosamente
      return;
    }
    
    if (!requestedOpen && !preventCloseRef.current) {
      console.log('Allowing authorized close');
      setInternalOpen(false);
      onOpenChange(false);
    }
  };

  const handleAuthorizedClose = () => {
    console.log('Authorized close initiated');
    if (hasChanges()) {
      setShowConfirmDialog(true);
    } else {
      console.log('No changes - proceeding with authorized close');
      preventCloseRef.current = false;
      setInternalOpen(false);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    setShowConfirmDeleteDialog(true);
  };

  const handleDiscardChanges = () => {
    console.log('Discarding changes and closing');
    setName(publication.name);
    setType(publication.type as 'reel' | 'carousel' | 'image');
    setDescription(publication.description || "");
    setCopywriting(publication.copywriting || "");
    setDesigner(publication.designer || "no_designer");
    setStatus(publication.needs_recording ? 'needs_recording' : publication.needs_editing ? 'needs_editing' : publication.in_editing ? 'in_editing' : publication.in_review ? 'in_review' : publication.approved ? 'approved' : publication.is_published ? 'published' : 'needs_recording');
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
    preventCloseRef.current = false;
    setInternalOpen(false);
    onOpenChange(false);
  };

  const handleAddLink = () => {
    if (newLinkLabel && newLinkUrl) {
      setLinks([...links, {
        label: newLinkLabel,
        url: newLinkUrl
      }]);
      setNewLinkLabel("");
      setNewLinkUrl("");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
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
      const {
        error
      } = await supabase.from('publications').update(updates).eq('id', publication.id);
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

  return <>
      <Dialog 
        open={open} 
        onOpenChange={onOpenChange}
        preventAutoClose={true}
        modal={true}
      >
        <DialogContent 
          className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto dark:bg-gray-900"
          preventAutoClose={true}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold dark:text-white">
                Editar Publicación
              </DialogTitle>
              {client && <Button variant="ghost" size="icon" onClick={handleOpenSocialLinks} className="ml-2" title="Abrir redes sociales">
                  <Share2 className="h-4 w-4" />
                </Button>}
            </div>
            <DialogDescription className="sr-only">
              Formulario para editar los detalles de una publicación de contenido
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[calc(80vh-120px)] pr-2 sm:pr-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {client && <div className="space-y-2 mb-4 border-b pb-4">
                  {client.clientInfo?.branding && <a href={client.clientInfo.branding} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      <LinkIcon className="h-4 w-4" />
                      <span className="truncate">Branding</span>
                    </a>}
                </div>}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">Nombre de la publicación</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} disabled={isDesigner} readOnly={isDesigner} className="w-full text-sm sm:text-base" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Tipo de contenido</Label>
                  <Select value={type} onValueChange={(value: 'reel' | 'carousel' | 'image') => setType(value)} disabled={isDesigner}>
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

                <div className="space-y-2 mx-0 my-[23px]">
                  <Label className="text-sm sm:text-base">Estado</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="text-sm sm:text-base">
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
                  <Label className="text-sm sm:text-base">Diseñador asignado</Label>
                  <Select value={designer} onValueChange={setDesigner} disabled={isDesigner}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Seleccionar diseñador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_designer">Sin diseñador</SelectItem>
                      {designers.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Fecha de publicación</Label>
                <div className="border rounded-lg p-2 max-h-[250px] overflow-y-auto">
                  <Calendar mode="single" selected={selectedDate} onSelect={date => date && setSelectedDate(date)} locale={es} disabled={isDesigner} className="rounded-md border" />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Fecha seleccionada: {format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", {
                  locale: es
                })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Links</Label>
                <Card>
                  <CardContent className="p-3 sm:p-4 space-y-4">
                    {!isDesigner && <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <Input placeholder="Etiqueta" value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} className="text-sm sm:text-base" />
                        </div>
                        <div className="flex-1">
                          <Input placeholder="URL" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} className="text-sm sm:text-base" />
                        </div>
                        <Button type="button" variant="outline" onClick={handleAddLink} className="w-full sm:w-auto">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>}
                    <ScrollArea className="h-[100px]">
                      <div className="space-y-2">
                        {links.map((link, index) => <div key={index} className="flex items-center gap-2 bg-secondary p-2 rounded text-sm">
                            {!isDesigner && <Button type="button" variant="ghost" size="sm" onClick={() => {
                          const newLinks = [...links];
                          newLinks.splice(index, 1);
                          setLinks(newLinks);
                        }} className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>}
                            <span className="flex-1 truncate">{link.label}</span>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>)}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="copywriting" className="text-sm sm:text-base">Copywriting</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleCopyText(copywriting, 'copywriting')} className="h-8">
                    {copyingCopywriting ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Textarea id="copywriting" value={copywriting} onChange={e => setCopywriting(e.target.value)} className="min-h-[150px] touch-manipulation text-sm sm:text-base" disabled={isDesigner} readOnly={isDesigner} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-sm sm:text-base">Descripción</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleCopyText(description, 'description')} className="h-8">
                    {copyingDescription ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} disabled={isDesigner} readOnly={isDesigner} className="min-h-[200px] touch-manipulation text-sm sm:text-base py-[192px]" />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                {onDelete && !isDesigner && <Button type="button" variant="destructive" onClick={handleDelete} className="w-full sm:w-auto text-sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>}
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto text-sm">
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
            <AlertDialogTitle className="text-gray-100">Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. ¿Qué deseas hacer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)} className="mt-0 font-normal text-slate-50 bg-zinc-700 hover:bg-zinc-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardChanges} className="bg-destructive hover:bg-destructive/90 text-slate-50">
              Descartar cambios
            </AlertDialogAction>
            <AlertDialogAction onClick={() => {
            handleSubmit();
            setShowConfirmDialog(false);
            preventCloseRef.current = false;
            setInternalOpen(false);
            onOpenChange(false);
          }} className="bg-primary hover:bg-primary/90">
              Guardar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmDeleteDialog} onOpenChange={setShowConfirmDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar esta publicación?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDeleteDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
            if (onDelete) {
              onDelete();
            }
            setShowConfirmDeleteDialog(false);
          }} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
};
