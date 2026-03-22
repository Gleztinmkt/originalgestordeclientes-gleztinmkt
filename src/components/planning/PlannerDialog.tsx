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
import { supabase } from "@/integrations/supabase/client";
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

interface PlannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlannerUpdated: () => void;
}

export const PlannerDialog = ({
  open,
  onOpenChange,
  onPlannerUpdated,
}: PlannerDialogProps) => {
  const [newPlannerName, setNewPlannerName] = useState("");
  const [editingPlanner, setEditingPlanner] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState<string | null>(null);

  const { data: planners = [], refetch } = useQuery({
    queryKey: ['planners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planners')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlannerName.trim()) return;

    try {
      const { error } = await supabase
        .from('planners')
        .insert([{ name: newPlannerName }]);

      if (error) throw error;

      toast({
        title: "Planificador agregado",
        description: "El planificador ha sido agregado correctamente.",
      });

      setNewPlannerName("");
      await refetch();
      onPlannerUpdated();
    } catch (error) {
      console.error('Error adding planner:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el planificador.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (id: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('planners')
        .update({ name: newName })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Planificador actualizado",
        description: "El nombre del planificador ha sido actualizado correctamente.",
      });

      setEditingPlanner(null);
      await refetch();
      onPlannerUpdated();
    } catch (error) {
      console.error('Error updating planner:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el planificador.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('planners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Planificador eliminado",
        description: "El planificador ha sido eliminado correctamente.",
      });

      setShowDeleteAlert(null);
      await refetch();
      onPlannerUpdated();
    } catch (error) {
      console.error('Error deleting planner:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el planificador.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gestionar planificadores</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newPlannerName}
                onChange={(e) => setNewPlannerName(e.target.value)}
                placeholder="Nombre del planificador"
              />
              <Button type="submit">Agregar</Button>
            </div>
          </form>

          <ScrollArea className="h-[300px] mt-4">
            <div className="space-y-2">
              {planners.map((planner) => (
                <div
                  key={planner.id}
                  className="flex items-center justify-between p-2 bg-secondary rounded-lg"
                >
                  {editingPlanner?.id === planner.id ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={editingPlanner.name}
                        onChange={(e) => setEditingPlanner({
                          ...editingPlanner,
                          name: e.target.value
                        })}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleEdit(planner.id, editingPlanner.name)}
                      >
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingPlanner(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span>{planner.name}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingPlanner({
                            id: planner.id,
                            name: planner.name
                          })}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowDeleteAlert(planner.id)}
                          className="text-destructive hover:text-destructive"
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
              Esta acción no se puede deshacer. El planificador será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteAlert && handleDelete(showDeleteAlert)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
