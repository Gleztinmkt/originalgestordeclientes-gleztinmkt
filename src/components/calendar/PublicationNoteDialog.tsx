
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PublicationNote } from "../client/publication/types";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface PublicationNoteDialogProps {
  publicationId: string;
  noteId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const PublicationNoteDialog = ({
  publicationId,
  noteId,
  open,
  onOpenChange,
  onSuccess
}: PublicationNoteDialogProps) => {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"new" | "done" | "received">("new");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!noteId;

  useEffect(() => {
    let isMounted = true;
    
    if (open && noteId) {
      const fetchNote = async () => {
        try {
          console.log("Fetching note with ID:", noteId);
          const { data, error } = await supabase
            .from("publication_notes")
            .select("*")
            .eq("id", noteId)
            .single();

          if (error) {
            console.error("Error fetching note:", error);
            toast({
              title: "Error",
              description: "No se pudo cargar la nota",
              variant: "destructive",
            });
            onOpenChange(false);
            return;
          }

          if (data && isMounted) {
            setContent(data.content);
            if (data.status === "new" || data.status === "done" || data.status === "received") {
              setStatus(data.status as "new" | "done" | "received");
            } else {
              setStatus("new");
            }
          }
        } catch (error) {
          console.error("Error in fetchNote:", error);
          toast({
            title: "Error",
            description: "Ocurrió un error al cargar la nota",
            variant: "destructive",
          });
          onOpenChange(false);
        }
      };

      fetchNote();
    } else if (open) {
      setContent("");
      setStatus("new");
    }
    
    return () => {
      isMounted = false;
    };
  }, [open, noteId, onOpenChange]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "El contenido no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Saving note:", isEditing ? "update" : "new", noteId || "new note");
      
      if (isEditing && noteId) {
        const { error } = await supabase
          .from("publication_notes")
          .update({
            content,
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", noteId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("publication_notes").insert({
          publication_id: publicationId,
          content,
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      toast({
        title: isEditing ? "Nota actualizada" : "Nota agregada",
        description: isEditing
          ? "La nota se ha actualizado correctamente"
          : "La nota se ha agregado correctamente",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => {
        onOpenChange(false);
      }, 300);
      
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la nota",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} preventAutoClose={true}>
      <DialogContent className="sm:max-w-md" preventAutoClose={true}>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar nota" : "Agregar nota"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza la información de la nota"
              : "Agrega una nueva nota a la publicación"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={status}
              onValueChange={(value: "new" | "done" | "received") => setStatus(value)}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
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

          <div className="space-y-2">
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe tu nota aquí..."
              className="min-h-[150px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⌛</span>
                {isEditing ? "Actualizando..." : "Guardando..."}
              </>
            ) : isEditing ? (
              "Actualizar"
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
