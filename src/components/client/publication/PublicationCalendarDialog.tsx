import { useState } from "react";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PublicationForm } from "./PublicationForm";
import { PublicationItem } from "./PublicationItem";
import { PublicationDescription } from "./PublicationDescription";
import { Publication, PublicationFormValues, PublicationCalendarDialogProps } from "./types";
import { useQuery } from "@tanstack/react-query";
import html2canvas from "html2canvas";
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
      package_id: packageId || null,
      is_published: false,
      copywriting: copywriting || null
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

  const generateCalendarImage = async () => {
    const calendarElement = document.createElement('div');
    calendarElement.className = 'p-8 bg-white text-black min-w-[800px]';
    
    const header = document.createElement('div');
    header.className = 'text-center mb-8';
    header.innerHTML = `
      <h1 class="text-3xl font-bold mb-2">Calendario de Publicaciones</h1>
      <h2 class="text-xl text-gray-600">${clientName}</h2>
      <p class="text-sm text-gray-500">Generado el ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
    `;
    calendarElement.appendChild(header);

    const list = document.createElement('div');
    list.className = 'space-y-4';
    
    publications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(pub => {
        const item = document.createElement('div');
        item.className = 'p-4 border rounded-lg';
        item.innerHTML = `
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold">${pub.name}</h3>
              <p class="text-sm text-gray-600">
                ${format(new Date(pub.date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
            <span class="px-3 py-1 rounded-full text-sm ${
              pub.type === 'reel' ? 'bg-blue-100 text-blue-800' :
              pub.type === 'carousel' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }">
              ${pub.type}
            </span>
          </div>
        `;
        list.appendChild(item);
      });
    
    calendarElement.appendChild(list);

    const footer = document.createElement('div');
    footer.className = 'mt-8 text-center text-sm text-gray-500';
    footer.innerHTML = 'Gestor de clientes Gleztin Marketing Digital';
    calendarElement.appendChild(footer);

    document.body.appendChild(calendarElement);

    try {
      const canvas = await html2canvas(calendarElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `calendario-${clientName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = image;
      link.click();

      toast({
        title: "Calendario generado",
        description: "La imagen se ha descargado correctamente.",
      });
    } catch (error) {
      console.error('Error generating calendar image:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen del calendario.",
        variant: "destructive",
      });
    } finally {
      document.body.removeChild(calendarElement);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={setIsOpen}
      preventAutoClose={true}
      forceMount={true}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors duration-200"
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto dark:bg-gray-900"
        preventAutoClose={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        data-prevent-autoclose="true"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold dark:text-white">
              Calendario de publicaciones - {clientName}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={generateCalendarImage}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Calendario
            </Button>
          </div>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
