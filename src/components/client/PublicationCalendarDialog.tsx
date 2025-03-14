
import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PublicationForm } from "./publication/PublicationForm";
import { PublicationItem } from "./publication/PublicationItem";
import { PublicationDescription } from "./publication/PublicationDescription";
import { Publication, PublicationFormValues, PublicationCalendarDialogProps } from "./publication/types";
import { useQuery } from "@tanstack/react-query";

export const PublicationCalendarDialog = ({ 
  clientId, 
  clientName,
  packageId 
}: PublicationCalendarDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);

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

    const typeShorthand = values.type === 'reel' ? 'r' : values.type === 'carousel' ? 'c' : 'i';
    const eventTitle = `${clientName} - ${typeShorthand} - ${values.name}`;

    const publicationData = {
      client_id: clientId,
      name: values.name,
      type: values.type,
      date: values.date.toISOString(),
      description: values.description || null,
      copywriting: values.copywriting || null,
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

  const handleManualClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Only allow opening, prevent automatic closing
        if (open) {
          setIsOpen(true);
        }
        // Let user manually close by clicking the Close button
      }}
      preventAutoClose={true}
      forceMount={true}
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
        className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto dark:bg-gray-900"
        preventAutoClose={true}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold dark:text-white">
            Calendario de publicaciones - {clientName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Administrar publicaciones para {clientName}
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

          <PublicationForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            packageId={packageId}
          />
          
          {/* Add explicit close button */}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={handleManualClose}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
