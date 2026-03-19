import { useState, useCallback } from "react";
import { Calendar as CalendarIcon, Download, ChevronDown, FolderOpen, Loader2, CheckCircle2, AlertCircle, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PublicationForm } from "./publication/PublicationForm";
import { PublicationItem } from "./publication/PublicationItem";
import { PublicationDescription } from "./publication/PublicationDescription";
import { Publication, PublicationFormValues, PublicationCalendarDialogProps } from "./publication/types";
import { DriveFolderSelectionDialog } from "./publication/DriveFolderSelectionDialog";
import { useQuery } from "@tanstack/react-query";
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } from "docx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { extractDriveFolderId } from "@/utils/driveUtils";
export const PublicationCalendarDialog = ({
  clientId,
  clientName,
  packageId,
  packageName,
  packageMonth,
  clientMaterialUrl,
  clientGeneralUrl,
  totalPublications
}: PublicationCalendarDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [copywriting, setCopywriting] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [driveStatus, setDriveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveFolderUrl, setDriveFolderUrl] = useState<string | null>(null);
  const [showDriveFolderSelection, setShowDriveFolderSelection] = useState(false);

  const handleCloseAttempt = useCallback((open: boolean) => {
    if (!open && (hasUnsavedChanges || isSubmitting || editingPublication)) {
      setShowCloseConfirmation(true);
      return;
    }
    setIsOpen(open);
  }, [hasUnsavedChanges, isSubmitting, editingPublication]);

  const handleForceClose = useCallback(() => {
    setShowCloseConfirmation(false);
    setHasUnsavedChanges(false);
    setEditingPublication(null);
    setIsOpen(false);
  }, []);
  const {
    data: publications = [],
    refetch
  } = useQuery({
    queryKey: ['publications', clientId, packageId],
    queryFn: async () => {
      const query = supabase.from('publications').select('*').eq('client_id', clientId).is('deleted_at', null).order('date', {
        ascending: true
      });
      if (packageId) {
        query.eq('package_id', packageId);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      return data as Publication[];
    }
  });
  const handleDelete = async (publicationId: string) => {
    try {
      const {
        error
      } = await supabase.from('publications').update({
        deleted_at: new Date().toISOString()
      }).eq('id', publicationId);
      if (error) throw error;
      await refetch();
      toast({
        title: "Publicación eliminada",
        description: "La publicación ha sido movida a la papelera."
      });
    } catch (error) {
      console.error('Error deleting publication:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la publicación. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    }
  };
  const handleSubmit = async (values: PublicationFormValues) => {
    if (!values.date || !values.name) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (editingPublication) {
        // Update existing publication - include status, designer, links
        const updates: any = {
          name: values.name,
          type: values.type,
          date: values.date.toISOString(),
          description: values.description || null,
          copywriting: values.copywriting || null,
          links: values.links || null,
          designer: values.designer || null
        };

        // Set status flags
        if (values.status) {
          updates.needs_recording = values.status === 'needs_recording';
          updates.needs_editing = values.status === 'needs_editing';
          updates.in_editing = values.status === 'in_editing';
          updates.in_review = values.status === 'in_review';
          updates.approved = values.status === 'approved';
          updates.is_published = values.status === 'published';
        }

        const { error } = await supabase
          .from('publications')
          .update(updates)
          .eq('id', editingPublication.id);
        
        if (error) throw error;
        
        toast({
          title: "Publicación actualizada",
          description: "La publicación se ha actualizado correctamente."
        });
        setEditingPublication(null);
      } else {
        // Insert new publication with status, designer and links from form
        const status = values.status || 'needs_recording';
        const publicationData = {
          client_id: clientId,
          name: values.name,
          type: values.type,
          date: values.date.toISOString(),
          description: values.description || null,
          copywriting: values.copywriting || null,
          package_id: packageId || null,
          is_published: status === 'published',
          needs_recording: status === 'needs_recording',
          needs_editing: status === 'needs_editing',
          in_editing: status === 'in_editing',
          in_review: status === 'in_review',
          approved: status === 'approved',
          designer: values.designer || null,
          links: values.links || null
        };

        const { error } = await supabase.from('publications').insert(publicationData);
        if (error) throw error;
        
        toast({
          title: "Publicación agregada",
          description: "La publicación se ha agregado correctamente."
        });
      }
      
      await refetch();
      setCopywriting("");
    } catch (error) {
      console.error('Error saving publication:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la publicación. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleTogglePublished = async (publicationId: string, isPublished: boolean) => {
    try {
      const {
        error
      } = await supabase.from('publications').update({
        is_published: isPublished
      }).eq('id', publicationId);
      if (error) throw error;
      await refetch();
      toast({
        title: isPublished ? "Publicación marcada como subida" : "Publicación marcada como pendiente",
        description: "El estado de la publicación ha sido actualizado."
      });
    } catch (error) {
      console.error('Error updating publication:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la publicación.",
        variant: "destructive"
      });
    }
  };
  const generateTxtCalendar = () => {
    try {
      const sortedPublications = publications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let txtContent = `CALENDARIO DE PUBLICACIONES\n`;
      txtContent += `${clientName}\n`;
      txtContent += `Generado el ${format(new Date(), "d 'de' MMMM 'de' yyyy", {
        locale: es
      })}\n\n`;
      txtContent += `${'='.repeat(60)}\n\n`;
      if (sortedPublications.length === 0) {
        txtContent += `No hay publicaciones programadas.\n\n`;
      } else {
        sortedPublications.forEach((pub, index) => {
          txtContent += `${index + 1}. ${pub.name}\n`;
          txtContent += `   Fecha: ${format(new Date(pub.date), "EEEE d 'de' MMMM", {
            locale: es
          })}\n`;
          txtContent += `   Tipo: ${pub.type === 'reel' ? 'Reel' : pub.type === 'carousel' ? 'Carrusel' : 'Imagen'}\n`;
          if (pub.description) {
            txtContent += `   Descripción: ${pub.description}\n`;
          }
          if (pub.copywriting) {
            txtContent += `   Copywriting: ${pub.copywriting}\n`;
          }
          txtContent += `   Estado: ${pub.is_published ? 'Publicado' : 'Pendiente'}\n`;
          txtContent += `\n`;
        });
      }
      txtContent += `${'='.repeat(60)}\n`;
      txtContent += `Gestor de clientes Gleztin Marketing Digital\n`;
      const blob = new Blob([txtContent], {
        type: 'text/plain;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `calendario-${clientName.toLowerCase().replace(/\s+/g, '-')}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Calendario descargado",
        description: "El calendario en formato TXT se ha descargado correctamente."
      });
    } catch (error) {
      console.error('Error generating TXT calendar:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el calendario en formato TXT.",
        variant: "destructive"
      });
    }
  };
  const generateWordCalendar = async () => {
    try {
      const sortedPublications = publications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const doc = new Document({
        sections: [{
          properties: {},
          children: [new Paragraph({
            children: [new TextRun({
              text: "Calendario de Publicaciones",
              bold: true,
              size: 28
            })],
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 200
            }
          }), new Paragraph({
            children: [new TextRun({
              text: clientName,
              bold: true,
              size: 20
            })],
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 200
            }
          }), new Paragraph({
            children: [new TextRun({
              text: `Generado el ${format(new Date(), "d 'de' MMMM 'de' yyyy", {
                locale: es
              })}`,
              size: 16,
              italics: true
            })],
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 400
            }
          }), ...(sortedPublications.length === 0 ? [new Paragraph({
            children: [new TextRun({
              text: "No hay publicaciones programadas.",
              size: 18
            })],
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 200
            }
          })] : [new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            rows: [new TableRow({
              children: [new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: "Fecha",
                    bold: true,
                    size: 18
                  })]
                })],
                width: {
                  size: 25,
                  type: WidthType.PERCENTAGE
                }
              }), new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: "Nombre",
                    bold: true,
                    size: 18
                  })]
                })],
                width: {
                  size: 35,
                  type: WidthType.PERCENTAGE
                }
              }), new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: "Tipo",
                    bold: true,
                    size: 18
                  })]
                })],
                width: {
                  size: 15,
                  type: WidthType.PERCENTAGE
                }
              }), new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: "Estado",
                    bold: true,
                    size: 18
                  })]
                })],
                width: {
                  size: 25,
                  type: WidthType.PERCENTAGE
                }
              })]
            }), ...sortedPublications.map(pub => new TableRow({
              children: [new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: format(new Date(pub.date), "d/MM/yyyy", {
                      locale: es
                    }),
                    size: 16
                  })]
                })]
              }), new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: pub.name,
                    size: 16
                  })]
                })]
              }), new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: pub.type === 'reel' ? 'Reel' : pub.type === 'carousel' ? 'Carrusel' : 'Imagen',
                    size: 16
                  })]
                })]
              }), new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: pub.is_published ? 'Publicado' : 'Pendiente',
                    size: 16
                  })]
                })]
              })]
            }))]
          })]), new Paragraph({
            text: ""
          }), new Paragraph({
            text: ""
          }), new Paragraph({
            children: [new TextRun({
              text: "Gestor de clientes Gleztin Marketing Digital",
              size: 16,
              italics: true
            })],
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 400
            }
          })]
        }]
      });
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([new Uint8Array(buffer)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `calendario-${clientName.toLowerCase().replace(/\s+/g, '-')}.docx`;
      link.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Calendario generado",
        description: "El documento Word se ha descargado correctamente."
      });
    } catch (error) {
      console.error('Error generating Word calendar:', error);
      toast({
        title: "Error en Word - Descargando TXT",
        description: "Hubo un problema con el formato Word. Descargando calendario en formato TXT...",
        variant: "destructive"
      });

      // Automatic fallback to TXT
      setTimeout(() => {
        generateTxtCalendar();
      }, 1000);
    }
  };

  const handleGenerateDriveFolders = useCallback(async (selectedIds: string[]) => {
    setDriveStatus("loading");
    setDriveError(null);
    const selectedPubs = publications.filter(p => selectedIds.includes(p.id));
    try {
      const scriptUrl = "https://script.google.com/macros/s/AKfycbyahM4qzOdRWIC1Sr3Xh1IArjk0BR1BKfzzFXKVESL1ovEEwV7NA-Wp7C75RP4ygCvovw/exec";
      const response = await fetch(scriptUrl, {
        method: "POST",
        body: JSON.stringify({
          action: "createCalendarFolders",
          urlMaterial: extractDriveFolderId(clientMaterialUrl || ""),
          nombrePaquete: packageMonth || packageName || "",
          publicaciones: selectedPubs.map(p => ({ id: p.id, nombre: p.name })),
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || data.message || "Error al crear carpetas");
      }

      if (data.publicaciones && Array.isArray(data.publicaciones)) {
        for (const pub of data.publicaciones) {
          if (pub.id && pub.urlMaterial) {
            const { data: currentPub } = await supabase
              .from('publications')
              .select('links')
              .eq('id', pub.id)
              .single();
            
            let currentLinksArray: Array<{label: string; url: string}> = [];
            if (currentPub?.links) {
              try {
                const parsed = JSON.parse(currentPub.links);
                if (Array.isArray(parsed)) {
                  currentLinksArray = parsed;
                } else {
                  currentLinksArray = [parsed];
                }
              } catch {
                currentLinksArray = [{ label: "enlace", url: currentPub.links }];
              }
            }
            const alreadyHas = currentLinksArray.some(
              l => l.label === "material" && l.url === pub.urlMaterial
            );
            if (!alreadyHas) {
              currentLinksArray.push({ label: "material", url: pub.urlMaterial });
            }
            const newLinks = JSON.stringify(currentLinksArray);
            
            await supabase
              .from('publications')
              .update({ links: newLinks })
              .eq('id', pub.id);
          }
        }
        await refetch();
      }

      setDriveStatus("success");
      if (data.url) {
        setDriveFolderUrl(data.url);
      }
      toast({ title: "Carpetas creadas", description: `Se crearon ${selectedPubs.length} carpeta(s) y se vincularon los enlaces de material.` });
    } catch (err: any) {
      console.error("Error creating Drive folders for calendar:", err);
      setDriveError(err.message || "Error desconocido");
      setDriveStatus("error");
    }
  }, [clientMaterialUrl, packageName, packageMonth, publications, refetch]);

  const [linkSyncStatus, setLinkSyncStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSyncDriveLinks = useCallback(async () => {
    setLinkSyncStatus("loading");
    try {
      const scriptUrl = "https://script.google.com/macros/s/AKfycbyahM4qzOdRWIC1Sr3Xh1IArjk0BR1BKfzzFXKVESL1ovEEwV7NA-Wp7C75RP4ygCvovw/exec";
      const response = await fetch(scriptUrl, {
        method: "POST",
        body: JSON.stringify({
          action: "createCalendarFolders",
          urlMaterial: extractDriveFolderId(clientMaterialUrl || ""),
          nombrePaquete: packageMonth || packageName || "",
          publicaciones: publications.map(p => ({ id: p.id, nombre: p.name })),
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || data.message || "Error al obtener enlaces");
      }

      let linkedCount = 0;
      if (data.publicaciones && Array.isArray(data.publicaciones)) {
        for (const pub of data.publicaciones) {
          if (pub.id && pub.urlMaterial) {
            const { data: currentPub } = await supabase
              .from('publications')
              .select('links')
              .eq('id', pub.id)
              .single();

            let currentLinksArray: Array<{label: string; url: string}> = [];
            if (currentPub?.links) {
              try {
                const parsed = JSON.parse(currentPub.links);
                if (Array.isArray(parsed)) {
                  currentLinksArray = parsed;
                } else {
                  currentLinksArray = [parsed];
                }
              } catch {
                currentLinksArray = [{ label: "enlace", url: currentPub.links }];
              }
            }

            // Check if material link already exists for this URL
            const alreadyHasMaterialLink = currentLinksArray.some(
              l => l.label === "material" && l.url === pub.urlMaterial
            );
            if (!alreadyHasMaterialLink) {
              currentLinksArray.push({ label: "material", url: pub.urlMaterial });
              await supabase
                .from('publications')
                .update({ links: JSON.stringify(currentLinksArray) })
                .eq('id', pub.id);
              linkedCount++;
            }
          }
        }
      }

      await refetch();
      setLinkSyncStatus("success");
      toast({
        title: "Enlaces sincronizados",
        description: linkedCount > 0
          ? `Se añadieron enlaces de material a ${linkedCount} publicación(es).`
          : "Todas las publicaciones ya tenían su enlace de material.",
      });
      setTimeout(() => setLinkSyncStatus("idle"), 3000);
    } catch (err: any) {
      console.error("Error syncing Drive links:", err);
      setLinkSyncStatus("error");
      toast({
        title: "Error",
        description: err.message || "No se pudieron sincronizar los enlaces.",
        variant: "destructive",
      });
      setTimeout(() => setLinkSyncStatus("idle"), 3000);
    }
  }, [clientMaterialUrl, packageMonth, packageName, publications, refetch]);

  return <><Dialog open={isOpen} onOpenChange={handleCloseAttempt}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors duration-200" onClick={() => setIsOpen(true)}>
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto dark:bg-gray-900">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold dark:text-white">
              Calendario de publicaciones - {clientName}
            </DialogTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Descargar
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={generateWordCalendar}>
                  <Download className="h-4 w-4 mr-2" />
                  Formato Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={generateTxtCalendar}>
                  <Download className="h-4 w-4 mr-2" />
                  Formato Texto (.txt)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DialogDescription className="sr-only">
            Gestión de publicaciones de contenido para el cliente
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            {publications.map(publication => <PublicationItem key={publication.id} publication={publication} onDelete={handleDelete} onTogglePublished={handleTogglePublished} onSelect={setSelectedPublication} onEdit={setEditingPublication} />)}
          </div>
          
          {selectedPublication && <PublicationDescription publication={selectedPublication} />}

          <div className="space-y-4">
            <div className="space-y-2">
              
              
            </div>

            <PublicationForm 
              onSubmit={(values) => {
                handleSubmit(values);
                setHasUnsavedChanges(false);
              }} 
              isSubmitting={isSubmitting} 
              packageId={packageId}
              editingPublication={editingPublication}
              onCancelEdit={() => { setEditingPublication(null); setHasUnsavedChanges(false); }}
              publicationDates={publications.map(p => new Date(p.date))}
              clientId={clientId}
              existingPublications={publications.map(p => ({ date: p.date }))}
              onPublicationsChange={refetch}
              onFormChange={setHasUnsavedChanges}
              clientGeneralUrl={clientGeneralUrl}
              totalPublications={totalPublications}
            />

            <div className="pt-2 border-t space-y-2">
              {driveStatus === "idle" && (
                <Button onClick={() => setShowDriveFolderSelection(true)} variant="outline" className="w-full" disabled={isSubmitting || publications.length === 0}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  📁 Generar carpetas del calendario en Drive
                </Button>
              )}
              {driveStatus === "loading" && (
                <Button disabled variant="outline" className="w-full">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando carpetas...
                </Button>
              )}
              {driveStatus === "success" && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg p-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>✅ Carpetas creadas</span>
                  {driveFolderUrl && (
                    <a
                      href={driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto font-medium underline hover:text-green-700"
                    >
                      Abrir paquete en Drive →
                    </a>
                  )}
                </div>
              )}
              {driveStatus === "error" && driveError && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{driveError}</span>
                  </div>
                  <Button onClick={() => { setDriveStatus("idle"); setDriveError(null); }} variant="outline" size="sm" className="w-full">
                    Reintentar
                  </Button>
                </div>
              )}

              <Button
                onClick={handleSyncDriveLinks}
                variant="outline"
                className="w-full"
                disabled={isSubmitting || linkSyncStatus === "loading"}
              >
                {linkSyncStatus === "loading" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sincronizando enlaces...</>
                ) : linkSyncStatus === "success" ? (
                  <><CheckCircle2 className="h-4 w-4 mr-2" />Enlaces sincronizados ✅</>
                ) : (
                  <><Link2 className="h-4 w-4 mr-2" />🔗 Sincronizar enlaces de Drive</>
                )}
              </Button>
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => handleCloseAttempt(false)} className="w-full sm:w-auto">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <AlertDialog open={showCloseConfirmation} onOpenChange={setShowCloseConfirmation}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cerrar sin guardar?</AlertDialogTitle>
          <AlertDialogDescription>
            {isSubmitting 
              ? "Se está guardando una publicación. Si cierras ahora podrías perder los cambios."
              : "Hay cambios sin guardar. Si cierras ahora se perderán."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleForceClose} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Cerrar sin guardar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <DriveFolderSelectionDialog
      open={showDriveFolderSelection}
      onOpenChange={setShowDriveFolderSelection}
      publications={publications}
      onGenerate={handleGenerateDriveFolders}
    />
  </>;
};