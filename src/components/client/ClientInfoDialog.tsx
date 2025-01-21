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
import { Client, ClientInfo } from "../types/client";
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
  const { data: publications = [], isLoading: isLoadingPublications } = useQuery({
    queryKey: ['publications', client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .eq('client_id', client.id)
        .is('deleted_at', null)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as Publication[];
    }
  });

  const handleSubmit = async (updatedInfo: ClientInfo) => {
    try {
      setIsLoading(true);
      
      // Convert the social networks to a plain object format that matches Json type
      const clientInfoJson = {
        generalInfo: updatedInfo.generalInfo,
        meetings: updatedInfo.meetings,
        socialNetworks: updatedInfo.socialNetworks.map(network => ({
          platform: network.platform,
          username: network.username
        }))
      };
      
      const { data, error } = await supabase
        .from('clients')
        .update({ client_info: clientInfoJson })
        .eq('id', client.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Información actualizada",
        description: "La información del cliente ha sido actualizada correctamente.",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating client info:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del cliente.",
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