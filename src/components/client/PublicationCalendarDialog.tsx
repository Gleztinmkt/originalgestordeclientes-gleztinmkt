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
import { buildDriveFolderUrl } from "@/utils/driveUtils";
...
        body: JSON.stringify({
          action: "createCalendarFolders",
          urlMaterial: buildDriveFolderUrl(clientMaterialUrl || ""),
          nombrePaquete: packageMonth || packageName || "",
          publicaciones: selectedPubs.map(p => ({ id: p.id, nombre: p.name })),
        }),
...
        body: JSON.stringify({
          action: "createCalendarFolders",
          urlMaterial: buildDriveFolderUrl(clientMaterialUrl || ""),
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