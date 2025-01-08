import { useState } from "react";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
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
import { PublicationForm } from "./publication/PublicationForm";
import { PublicationList } from "./publication/PublicationList";
import { Publication, PublicationFormValues } from "./publication/types";
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
      package_id: packageId || null
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
          <div className="space-y-4">
            {publications.map((publication) => (
              <div 
                key={publication.id} 
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                onClick={() => setSelectedPublication(publication)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={publication.is_published}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleTogglePublished(publication.id, e.target.checked);
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <p className="font-medium dark:text-white">
                      {publication.name}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(publication.date), "dd/MM/yyyy")} • {publication.type}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(publication.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {selectedPublication && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2">Descripción</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {selectedPublication.description || "Sin descripción"}
              </p>
            </div>
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
