
import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

import { PublicationNote } from "@/components/client/publication/types";

interface PublicationNoteViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicationId: string;
  onEdit: (noteId: string) => void;
  onSuccess?: () => void;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return format(date, "dd/MM/yyyy HH:mm");
};

const getStatusColor = (status: PublicationNote["status"]) => {
  switch (status) {
    case "new":
      return {
        bg: "bg-yellow-500",
        border: "border-yellow-500",
      };
    case "done":
      return {
        bg: "bg-green-500",
        border: "border-green-500",
      };
    case "received":
      return {
        bg: "bg-blue-500",
        border: "border-blue-500",
      };
    default:
      return {
        bg: "bg-gray-400",
        border: "border-gray-400",
      };
  }
};

export const PublicationNoteView = ({
  open,
  onOpenChange,
  publicationId,
  onEdit,
  onSuccess
}: PublicationNoteViewProps) => {
  const [publicationStatus, setPublicationStatus] = useState<PublicationNote["status"]>("new");
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading, refetch } = useQuery({
    queryKey: ["publicationNotes", publicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publication_notes")
        .select("*")
        .eq("publication_id", publicationId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las notas",
          variant: "destructive",
        });
        return [];
      }

      return data as PublicationNote[];
    },
    enabled: open,
  });

  useEffect(() => {
    if (notes.length > 0) {
      setPublicationStatus(notes[0].status);
    }
  }, [notes]);

  const handleUpdatePublicationStatus = async (newStatus: PublicationNote["status"]) => {
    try {
      const { error } = await supabase
        .from("publication_notes")
        .update({ status: newStatus })
        .eq("publication_id", publicationId);

      if (error) {
        console.error("Error updating status:", error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Estado actualizado",
        description: "El estado se ha actualizado correctamente",
      });
      
      // Invalidate the query to refetch notes - fix the type error
      queryClient.invalidateQueries({
        queryKey: ["publicationNotes", publicationId]
      });
      
    } catch (error) {
      console.error("Error in handleStatusChange:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const handleUpdateNoteStatus = async (noteId: string, newStatus: PublicationNote["status"]) => {
    try {
      const { error } = await supabase
        .from("publication_notes")
        .update({ status: newStatus })
        .eq("id", noteId);

      if (error) {
        console.error("Error updating note status:", error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado de la nota",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Estado actualizado",
        description: "El estado de la nota se ha actualizado correctamente",
      });
      
      // Invalidate the query to refetch notes - fix the type error
      queryClient.invalidateQueries({
        queryKey: ["publicationNotes", publicationId]
      });
      
    } catch (error) {
      console.error("Error in handleNoteStatusChange:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el estado de la nota",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = () => {
    onOpenChange(false);
    setTimeout(() => {
      onEdit(null as any);
    }, 300);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("publication_notes")
        .delete()
        .eq("id", noteId);

      if (error) {
        console.error("Error deleting note:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la nota",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Nota eliminada",
        description: "La nota se ha eliminado correctamente",
      });
      
      // Invalidate the query to refetch notes - fix the type error
      queryClient.invalidateQueries({
        queryKey: ["publicationNotes", publicationId]
      });
      
    } catch (error) {
      console.error("Error in handleDeleteNote:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la nota",
        variant: "destructive",
      });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notas de publicación</DialogTitle>
          <DialogDescription>
            Ver y gestionar notas para esta publicación
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Estado general:</h3>
          <Select
            defaultValue={publicationStatus}
            onValueChange={(value: "new" | "done" | "received") => {
              setPublicationStatus(value);
              handleUpdatePublicationStatus(value);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
              <SelectItem value="new" className="cursor-pointer">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                  Nuevo
                </div>
              </SelectItem>
              <SelectItem value="done" className="cursor-pointer">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                  Completado
                </div>
              </SelectItem>
              <SelectItem value="received" className="cursor-pointer">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                  Recibido
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Historial de notas</h3>
            <Button variant="outline" size="sm" onClick={handleAddNote}>
              Añadir nota
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 border-2 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No hay notas para esta publicación
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-4 pr-4">
                {notes.map((note) => (
                  <div 
                    key={note.id} 
                    className={`p-3 rounded-lg border ${
                      getStatusColor(note.status).border
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            getStatusColor(note.status).bg
                          }`} 
                        />
                        <span className="text-xs text-gray-500">
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleEditNote(note.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          onClick={() => handleDeleteNote(note.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <Select
                        value={note.status}
                        onValueChange={(value: "new" | "done" | "received") => {
                          handleUpdateNoteStatus(note.id, value);
                        }}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
                          <SelectItem value="new" className="cursor-pointer">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                              Nuevo
                            </div>
                          </SelectItem>
                          <SelectItem value="done" className="cursor-pointer">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                              Completado
                            </div>
                          </SelectItem>
                          <SelectItem value="received" className="cursor-pointer">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                              Recibido
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
