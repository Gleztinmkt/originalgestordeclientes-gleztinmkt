import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PublicationForm } from "./PublicationForm";
import { PublicationItem } from "./PublicationItem";
import { PublicationDescription } from "./PublicationDescription";
import { GoogleCalendarIntegration } from "./GoogleCalendarIntegration";
import { Publication, PublicationFormValues, PublicationCalendarDialogProps } from "./types";
import { useQuery } from "@tanstack/react-query";
import { 
  createGoogleCalendarEvent, 
  deleteGoogleCalendarEvent,
} from "@/utils/googleCalendar";

export const PublicationCalendarDialog = ({ 
  clientId, 
  clientName,
  packageId 
}: PublicationCalendarDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string>("");

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
      const publication = publications.find(p => p.id === publicationId);
      if (publication?.google_calendar_event_id && publication?.google_calendar_id && accessToken) {
        await deleteGoogleCalendarEvent(
          accessToken,
          publication.google_calendar_id,
          publication.google_calendar_event_id
        );
      }

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

    if (!selectedCalendarId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un calendario de Google.",
        variant: "destructive",
      });
      return;
    }

    const typeShorthand = values.type === 'reel' ? 'r' : values.type === 'carousel' ? 'c' : 'i';
    const eventTitle = `${clientName} - ${typeShorthand} - ${values.name}`;

    try {
      setIsSubmitting(true);

      const endDate = new Date(values.date);
      endDate.setHours(endDate.getHours() + 1);

      const eventId = await createGoogleCalendarEvent(
        accessToken,
        selectedCalendarId,
        {
          title: eventTitle,
          description: values.description,
          startDate: values.date,
          endDate,
        }
      );

      const publicationData = {
        client_id: clientId,
        name: values.name,
        type: values.type,
        date: values.date.toISOString(),
        description: values.description || null,
        package_id: packageId || null,
        is_published: false,
        google_calendar_event_id: eventId,
        google_calendar_id: selectedCalendarId
      };

      const { error } = await supabase
        .from('publications')
        .insert(publicationData);

      if (error) throw error;

      toast({
        title: "Publicación agregada",
        description: "La publicación se ha agregado correctamente y sincronizado con Google Calendar.",
      });

      await refetch();
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

  const handleCalendarSelect = (calendarId: string, token: string) => {
    setSelectedCalendarId(calendarId);
    setAccessToken(token);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors duration-200"
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold dark:text-white">
            Calendario de publicaciones - {clientName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <GoogleCalendarIntegration onCalendarSelect={handleCalendarSelect} />

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

          <PublicationForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            packageId={packageId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};