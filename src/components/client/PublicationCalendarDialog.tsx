
import { useState } from "react";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PublicationForm } from "./publication/PublicationForm";
import { PublicationItem } from "./publication/PublicationItem";
import { PublicationDescription } from "./publication/PublicationDescription";
import { Publication, PublicationFormValues, PublicationCalendarDialogProps } from "./publication/types";
import { useQuery } from "@tanstack/react-query";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from "docx";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const PublicationCalendarDialog = ({ 
  clientId, 
  clientName,
  packageId 
}: PublicationCalendarDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [copywriting, setCopywriting] = useState("");

  const { data: publications = [], refetch } = useQuery({
    queryKey: ['publications', clientId, packageId],
    queryFn: async () => {
      const query = supabase
        .from('publications')
        .select('*')
        .eq('client_id', clientId)
        .is('deleted_at', null)
        .order('date', { ascending: true });

      if (packageId) {
        query.eq('package_id', packageId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Publication[];
    },
  });

  const handleDelete = async (publicationId: string) => {
    try {
      const { error } = await supabase
        .from('publications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', publicationId);

      if (error) throw error;
      await refetch();
      
      toast({
        title: "Publicación eliminada",
        description: "La publicación ha sido movida a la papelera.",
      });
    } catch (error) {
      console.error('Error deleting publication:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la publicación. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (values: PublicationFormValues) => {
    if (!values.date || !values.name) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    const publicationData = {
      client_id: clientId,
      name: values.name,
      type: values.type,
      date: values.date.toISOString(),
      description: values.description || null,
      copywriting: copywriting || null,
      package_id: packageId || null,
      is_published: false
    };

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('publications')
        .insert(publicationData);

      if (error) throw error;

      toast({
        title: "Publicación agregada",
        description: "La publicación se ha agregado correctamente.",
      });

      await refetch();
      setCopywriting("");
    } catch (error) {
      console.error('Error adding publication:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la publicación. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublished = async (publicationId: string, isPublished: boolean) => {
    try {
      const { error } = await supabase
        .from('publications')
        .update({ is_published: isPublished })
        .eq('id', publicationId);

      if (error) throw error;
      await refetch();
      
      toast({
        title: isPublished ? "Publicación marcada como subida" : "Publicación marcada como pendiente",
        description: "El estado de la publicación ha sido actualizado.",
      });
    } catch (error) {
      console.error('Error updating publication:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la publicación.",
        variant: "destructive",
      });
    }
  };

  const generateCalendarDocument = async () => {
    try {
      // Sort publications by date
      const sortedPublications = publications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Header
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Calendario de Publicaciones",
                    bold: true,
                    size: 32,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              }),
              
              // Client name
              new Paragraph({
                children: [
                  new TextRun({
                    text: clientName,
                    bold: true,
                    size: 24,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),

              // Generation date
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Generado el ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`,
                    size: 20,
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),

              // Publications table
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                rows: [
                  // Header row
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Fecha", bold: true })],
                        })],
                        width: { size: 25, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Nombre", bold: true })],
                        })],
                        width: { size: 35, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Tipo", bold: true })],
                        })],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Descripción", bold: true })],
                        })],
                        width: { size: 25, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                  // Publication rows
                  ...sortedPublications.map(pub => new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({
                            text: format(new Date(pub.date), "EEEE d 'de' MMMM", { locale: es }),
                            size: 20,
                          })],
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({
                            text: pub.name,
                            size: 20,
                          })],
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({
                            text: pub.type === 'reel' ? 'Reel' : pub.type === 'carousel' ? 'Carrusel' : 'Imagen',
                            size: 20,
                          })],
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({
                            text: pub.description || '-',
                            size: 20,
                          })],
                        })],
                      }),
                    ],
                  })),
                ],
              }),

              // Footer space
              new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),

              // Footer
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Gestor de clientes Gleztin Marketing Digital",
                    size: 18,
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 },
              }),
            ],
          },
        ],
      });

      // Generate and download document
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { 
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
        description: "El documento Word se ha descargado correctamente.",
      });
    } catch (error) {
      console.error('Error generating calendar document:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el documento del calendario.",
        variant: "destructive",
      });
    }
  };

  const handleManualClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={setIsOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors duration-200"
          onClick={() => setIsOpen(true)}
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto dark:bg-gray-900"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold dark:text-white">
              Calendario de publicaciones - {clientName}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={generateCalendarDocument}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Calendario
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Gestión de publicaciones de contenido para el cliente
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            {publications.map((publication) => (
              <PublicationItem
                key={publication.id}
                publication={publication}
                onDelete={handleDelete}
                onTogglePublished={handleTogglePublished}
                onSelect={setSelectedPublication}
              />
            ))}
          </div>
          
          {selectedPublication && (
            <PublicationDescription publication={selectedPublication} />
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="copywriting">Copywriting</Label>
              <Textarea
                id="copywriting"
                value={copywriting}
                onChange={(e) => setCopywriting(e.target.value)}
                placeholder="Ingresa el copywriting para la publicación..."
                className="min-h-[100px] resize-y"
              />
            </div>

            <PublicationForm 
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting}
              packageId={packageId}
            />

            {/* Botón de cerrar explícito */}
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
