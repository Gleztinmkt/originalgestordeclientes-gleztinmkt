
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PublicationNote } from "../client/publication/types";

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
    if (open && noteId) {
      const fetchNote = async () => {
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
          return;
        }

        if (data) {
          setContent(data.content);
          // Ensure the status is a valid enum value
          if (data.status === "new" || data.status === "done" || data.status === "received") {
            setStatus(data.status as "new" | "done" | "received");
          } else {
            // Default to "new" if status is invalid
            setStatus("new");
            console.warn(`Invalid status received: ${data.status}, defaulting to "new"`);
          }
        }
      };

      fetchNote();
    } else if (open) {
      // Reset form for new notes
      setContent("");
      setStatus("new");
    }
  }, [open, noteId]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un contenido para la nota",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("publication_notes")
          .update({
            content,
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", noteId);

        if (error) throw error;

        toast({
          title: "Nota actualizada",
          description: "La nota se ha actualizado correctamente",
        });
      } else {
        const { error } = await supabase.from("publication_notes").insert({
          publication_id: publicationId,
          content,
          status,
        });

        if (error) throw error;

        toast({
          title: "Nota agregada",
          description: "La nota se ha agregado correctamente",
        });
      }

      onSuccess();
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Nota" : "Agregar Nota"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe tu nota aquí..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <RadioGroup value={status} onValueChange={(value: "new" | "done" | "received") => setStatus(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="text-yellow-500">Nueva</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="done" id="done" />
                <Label htmlFor="done" className="text-green-500">Hecha</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="received" id="received" />
                <Label htmlFor="received" className="text-blue-500">Recibida</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
