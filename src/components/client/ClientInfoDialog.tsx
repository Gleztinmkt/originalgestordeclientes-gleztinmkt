import { useState } from "react";
import { Calendar } from "lucide-react";
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
import { PublicationItem } from "./publication/PublicationItem";
import { PublicationDescription } from "./publication/PublicationDescription";
import { Publication } from "./publication/types";
import { Client } from "../types/client";
import { useQuery } from "@tanstack/react-query";

interface ClientInfoDialogProps {
  client: Client;
  onUpdate?: () => void;
}

export const ClientInfoDialog = ({ client, onUpdate }: ClientInfoDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);

  // Fetch publications for this client
  const { data: publications = [], refetch } = useQuery({
    queryKey: ['publications', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .eq('client_id', client.id)
        .is('deleted_at', null)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as Publication[];
    },
    enabled: !!client?.id
  });

  const handleSubmit = async (values: { 
    name: string;
    type: "reel" | "carousel" | "image";
    date: Date;
    description: string;
    copywriting: string;
  }) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('publications')
        .insert({
          client_id: client.id,
          name: values.name,
          type: values.type,
          date: values.date.toISOString(),
          description: values.description || null,
          copywriting: values.copywriting || null,
          package_id: client.packages?.[0]?.id
        });

      if (error) throw error;

      await refetch();

      toast({
        title: "Publicación creada",
        description: "La publicación ha sido creada correctamente.",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error creating publication:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la publicación.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        description: "La publicación ha sido eliminada correctamente.",
      });
    } catch (error) {
      console.error('Error deleting publication:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la publicación.",
        variant: "destructive",
      });
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
        title: "Estado actualizado",
        description: "El estado de la publicación ha sido actualizado.",
      });
    } catch (error) {
      console.error('Error updating publication status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la publicación.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors duration-200"
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold dark:text-white">
            Información del Cliente - {client.name}
          </DialogTitle>
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
            isSubmitting={isLoading}
            packageId={client.packages?.[0]?.id}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};