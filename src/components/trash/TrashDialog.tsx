import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type TableNames = "clients" | "tasks" | "publications";

interface DeletedItem {
  type: "client" | "task" | "publication";
  id: string;
  content: string;
  deleted_at: string;
}

export const TrashDialog = () => {
  const [open, setOpen] = useState(false);

  const { data: deletedItems = [], refetch } = useQuery({
    queryKey: ['deleted-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deleted_items')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      return data as DeletedItem[];
    },
  });

  const handleRestore = async (item: DeletedItem) => {
    try {
      const getTableName = (type: DeletedItem["type"]): TableNames => {
        switch (type) {
          case "client": return "clients";
          case "task": return "tasks";
          case "publication": return "publications";
        }
      };

      const tableName = getTableName(item.type);
      
      const { error } = await supabase
        .from(tableName)
        .update({ deleted_at: null })
        .eq('id', item.id);

      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error('Error restoring item:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold dark:text-white">
            Papelera
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {deletedItems.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No hay elementos eliminados
            </p>
          ) : (
            deletedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
              >
                <div className="flex-1">
                  <p className="font-medium dark:text-white">{item.content}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • 
                    Eliminado el {format(new Date(item.deleted_at), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRestore(item)}
                  className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};