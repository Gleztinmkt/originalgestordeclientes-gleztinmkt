import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Edit2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Designer {
  id: string;
  name: string;
}

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
  onDesignerDeleted 
}: DesignerDialogProps) => {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [newDesigner, setNewDesigner] = useState("");
  const [editingDesigner, setEditingDesigner] = useState<Designer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddDesigner = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('designers')
        .insert({ name: newDesigner })
        .select()
        .single();

      if (error) throw error;

      setDesigners(prev => [...prev, { id: data.id, name: newDesigner }]);
      setNewDesigner("");
      onDesignerAdded?.();

      toast({
        title: "Diseñador agregado",
        description: "El diseñador ha sido agregado correctamente.",
      });
    } catch (error) {
      console.error('Error adding designer:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el diseñador. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDesigner = async (id: string) => {
    try {
      const { error } = await supabase
        .from('designers')
        .update({ name: editingDesigner?.name })
        .eq('id', id);

      if (error) throw error;

      setDesigners(prev => prev.map(d => d.id === id ? { ...d, name: editingDesigner?.name || '' } : d));
      setEditingDesigner(null);

      toast({
        title: "Diseñador actualizado",
        description: "El diseñador ha sido actualizado correctamente.",
      });
    } catch (error) {
      console.error('Error updating designer:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el diseñador. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDesigner = async (id: string) => {
    try {
      const { error } = await supabase
        .from('designers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDesigners(prev => prev.filter(d => d.id !== id));
      onDesignerDeleted?.();

      toast({
        title: "Diseñador eliminado",
        description: "El diseñador ha sido eliminado correctamente.",
      });
    } catch (error) {
      console.error('Error deleting designer:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el diseñador. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestionar Diseñadores</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nombre del diseñador"
              value={newDesigner}
              onChange={(e) => setNewDesigner(e.target.value)}
            />
            <Button onClick={handleAddDesigner} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agregar"}
            </Button>
          </div>
          <div className="space-y-2">
            {designers.map((designer) => (
              <div key={designer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                {editingDesigner?.id === designer.id ? (
                  <Input
                    value={editingDesigner.name}
                    onChange={(e) => setEditingDesigner({ ...editingDesigner, name: e.target.value })}
                    className="flex-1 mr-2"
                  />
                ) : (
                  <span>{designer.name}</span>
                )}
                <div className="flex gap-2">
                  {editingDesigner?.id === designer.id ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDesigner(designer.id)}
                    >
                      Guardar
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingDesigner(designer)}
                    >
                      <Edit2 className="h-4 w-4 text-blue-500" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDesigner(designer.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};