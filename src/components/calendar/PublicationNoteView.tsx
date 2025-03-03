
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, CheckCircle, Clock } from "lucide-react";
import { PublicationNote } from "../client/publication/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PublicationNoteViewProps {
  publicationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (noteId: string) => void;
  onSuccess: () => void;
}

export const PublicationNoteView = ({
  publicationId,
  open,
  onOpenChange,
  onEdit,
  onSuccess
}: PublicationNoteViewProps) => {
  const [notes, setNotes] = useState<PublicationNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchNotes();
    }
  }, [open, publicationId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("publication_notes")
        .select("*")
        .eq("publication_id", publicationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Ensure each note has a valid status before setting to state
      const typedNotes: PublicationNote[] = (data || []).map(note => {
        let validStatus: "new" | "done" | "received" = "new";
        if (note.status === "new" || note.status === "done" || note.status === "received") {
          validStatus = note.status as "new" | "done" | "received";
        } else {
          console.warn(`Invalid status found: ${note.status}, defaulting to "new"`);
        }
        
        return {
          ...note,
          status: validStatus
        };
      });
      
      setNotes(typedNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las notas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (noteId: string, status: "new" | "done" | "received") => {
    try {
      const { error } = await supabase
        .from("publication_notes")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteId);

      if (error) throw error;

      // Update local state first for optimistic UI update
      setNotes(
        notes.map((note) =>
          note.id === noteId ? { ...note, status } : note
        )
      );

      toast({
        title: "Estado actualizado",
        description: "El estado de la nota se ha actualizado correctamente",
      });

      // Refetch notes to ensure consistency
      setTimeout(() => {
        onSuccess();
      }, 50);
    } catch (error) {
      console.error("Error updating note status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la nota",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("publication_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      // Update local state first for optimistic UI update
      setNotes(notes.filter((note) => note.id !== noteId));

      toast({
        title: "Nota eliminada",
        description: "La nota se ha eliminado correctamente",
      });

      // Notify parent component
      setTimeout(() => {
        onSuccess();
      }, 50);
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la nota",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "received":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "done":
        return "Hecha";
      case "received":
        return "Recibida";
      default:
        return "Nueva";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "text-green-500";
      case "received":
        return "text-blue-500";
      default:
        return "text-yellow-500";
    }
  };

  const handleEditNote = (noteId: string) => {
    if (!noteId) {
      console.error("Note ID is missing");
      return;
    }
    
    console.log("Editing note with ID:", noteId);
    
    // First close the note view dialog
    onOpenChange(false);
    
    // Add a small delay before triggering the edit action to prevent UI conflicts
    setTimeout(() => {
      onEdit(noteId);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Notas de la Publicación</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-4">
            <p>Cargando notas...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No hay notas para esta publicación</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 border rounded-lg bg-secondary"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(note.status)}
                    <span className={`text-sm font-medium ${getStatusColor(note.status)}`}>
                      {getStatusText(note.status)}
                    </span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Opciones</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2">
                      <div className="grid gap-1">
                        <Button
                          variant="ghost"
                          className="justify-start text-sm"
                          onClick={() => handleEditNote(note.id)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start text-sm text-green-500"
                          onClick={() => handleUpdateStatus(note.id, "done")}
                          disabled={note.status === "done"}
                        >
                          Marcar como hecha
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start text-sm text-blue-500"
                          onClick={() => handleUpdateStatus(note.id, "received")}
                          disabled={note.status === "received"}
                        >
                          Marcar como recibida
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start text-sm text-yellow-500"
                          onClick={() => handleUpdateStatus(note.id, "new")}
                          disabled={note.status === "new"}
                        >
                          Marcar como nueva
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start text-sm text-red-500"
                          onClick={() => handleDelete(note.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {format(new Date(note.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
