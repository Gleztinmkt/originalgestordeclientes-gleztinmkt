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
import { PublicationForm } from "./publication/PublicationForm";
import { PublicationList } from "./publication/PublicationList";
import { Publication } from "./publication/types";
import { useQuery } from "@tanstack/react-query";

interface PublicationCalendarDialogProps {
  clientId: string;
  clientName: string;
}

export const PublicationCalendarDialog = ({ clientId, clientName }: PublicationCalendarDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: publications = [], refetch } = useQuery({
    queryKey: ['publications', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as Publication[];
    },
  });

  const handleSubmit = async (values: {
    name: string;
    type: Publication["type"];
    date: Date;
    description: string;
  }) => {
    if (!values.date || !values.name) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    const publicationData: Omit<Publication, 'id' | 'created_at'> = {
      client_id: clientId,
      name: values.name,
      type: values.type,
      date: values.date.toISOString(),
      description: values.description || null,
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
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold dark:text-white">
            Calendario de publicaciones - {clientName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <PublicationList publications={publications} />
          <PublicationForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      </DialogContent>
    </Dialog>
  );
};