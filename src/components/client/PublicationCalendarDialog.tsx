import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PublicationForm } from "./publication/PublicationForm";
import { PublicationList } from "./publication/PublicationList";
import { PublicationDescription } from "./publication/PublicationDescription";
import { Publication, PublicationCalendarDialogProps } from "./publication/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const PublicationCalendarDialog = ({ 
  clientId,
  clientName 
}: PublicationCalendarDialogProps) => {
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);

  const handleTogglePublished = async (id: string, isPublished: boolean) => {
    try {
      const { error } = await supabase
        .from('publications')
        .update({ is_published: isPublished })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Publicación actualizada",
        description: `La publicación ha sido marcada como ${isPublished ? 'publicada' : 'pendiente'}.`,
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
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Calendar className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] dark:bg-gray-900 dark:text-white">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold dark:text-white">
            Calendario de publicaciones - {clientName}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <PublicationForm clientId={clientId} />
          <PublicationList 
            clientId={clientId} 
            onSelect={setSelectedPublication}
            onTogglePublished={handleTogglePublished}
          />
        </div>
      </SheetContent>
      <PublicationDescription 
        publication={selectedPublication}
        onClose={() => setSelectedPublication(null)}
      />
    </Sheet>
  );
};