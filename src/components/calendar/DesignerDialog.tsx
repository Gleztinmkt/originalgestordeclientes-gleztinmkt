import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DesignerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDesignerAdded: () => void;
  onDesignerDeleted: () => void;
}

export const DesignerDialog = ({
  open,
  onOpenChange,
  onDesignerAdded,
  onDesignerDeleted,
}: DesignerDialogProps) => {
  const [newDesignerName, setNewDesignerName] = useState("");
  const [editingDesigner, setEditingDesigner] = useState<{ id: string; name: string; oldName: string } | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState<string | null>(null);

  const { data: designers = [], refetch } = useQuery({
    queryKey: ['designers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('designers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDesignerName.trim()) return;

    try {
      const { error } = await supabase
        .from('designers')
        .insert([{ name: newDesignerName }]);

      if (error) throw error;

      toast({
        title: "Diseñador agregado",
        description: "El diseñador ha sido agregado correctamente.",
      });

      setNewDesignerName("");
      await refetch();
      onDesignerAdded();
    } catch (error) {
      console.error('Error adding designer:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el diseñador.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (id: string, newName: string) => {
    try {
      // First update the designer's name
      const { error: designerError } = await supabase
        .from('designers')
        .update({ name: newName })
        .eq('id', id);

      if (designerError) throw designerError;

      // Then update all publications that reference this designer
      if (editingDesigner?.oldName) {
        const { error: publicationsError } = await supabase
          .from('publications')
          .update({ designer: newName })
          .eq('designer', editingDesigner.oldName);

        if (publicationsError) throw publicationsError;
      }

      toast({
        title: "Diseñador actualizado",
        description: "El nombre del diseñador ha sido actualizado correctamente.",
      });

      setEditingDesigner(null);
      await refetch();
    } catch (error) {
      console.error('Error updating designer:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el diseñador.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: designer } = await supabase
        .from('designers')
        .select('name')
        .eq('id', id)
        .single();

      if (!designer) throw new Error('Designer not found');

      // First clear the designer from all publications
      const { error: publicationsError } = await supabase
        .from('publications')
        .update({ designer: null })
        .eq('designer', designer.name);

      if (publicationsError) throw publicationsError;

      // Then delete the designer
      const { error: deleteError } = await supabase
        .from('designers')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast({
        title: "Diseñador eliminado",
        description: "El diseñador ha sido eliminado correctamente.",
      });

      setShowDeleteAlert(null);
      await refetch();
      onDesignerDeleted();
    } catch (error) {
      console.error('Error deleting designer:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el diseñador.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gestionar diseñadores</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newDesignerName}
                onChange={(e) => setNewDesignerName(e.target.value)}
                placeholder="Nombre del diseñador"
              />
              <Button type="submit">Agregar</Button>
            </div>
          </form>

          <ScrollArea className="h-[300px] mt-4">
            <div className="space-y-2">
              {designers.map((designer) => (
                <div
                  key={designer.id}
                  className="flex items-center justify-between p-2 bg-secondary rounded-lg"
                >
                  {editingDesigner?.id === designer.id ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={editingDesigner.name}
                        onChange={(e) => setEditingDesigner({ 
                          ...editingDesigner, 
                          name: e.target.value 
                        })}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleEdit(designer.id, editingDesigner.name)}
                      >
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingDesigner(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span>{designer.name}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingDesigner({
                            id: designer.id,
                            name: designer.name,
                            oldName: designer.name
                          })}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowDeleteAlert(designer.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!showDeleteAlert} onOpenChange={() => setShowDeleteAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El diseñador será eliminado permanentemente y se removerá de todas las publicaciones asignadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteAlert && handleDelete(showDeleteAlert)}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};