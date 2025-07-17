import { useState } from "react";
import { Calendar as CalendarIcon, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PublicationForm } from "./publication/PublicationForm";
import { PublicationItem } from "./publication/PublicationItem";
import { PublicationDescription } from "./publication/PublicationDescription";
import { Publication, PublicationFormValues, PublicationCalendarDialogProps } from "./publication/types";
import { useQuery } from "@tanstack/react-query";
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } from "docx";
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
      const {
        error
      } = await supabase.from('publications').insert(publicationData);
      if (error) throw error;
      toast({
        title: "Publicación agregada",
        description: "La publicación se ha agregado correctamente."
      });
      await refetch();
      setCopywriting("");
    } catch (error) {
      console.error('Error adding publication:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la publicación. Por favor, intenta de nuevo.",
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
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            {publications.map(publication => <PublicationItem key={publication.id} publication={publication} onDelete={handleDelete} onTogglePublished={handleTogglePublished} onSelect={setSelectedPublication} />)}
          </div>
          
          {selectedPublication && <PublicationDescription publication={selectedPublication} />}

          <div className="space-y-4">
            <div className="space-y-2">
              
              
            </div>

            <PublicationForm onSubmit={handleSubmit} isSubmitting={isSubmitting} packageId={packageId} />

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};