import { useState } from "react";
import { Trash2, RotateCcw, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TableNames = "clients" | "tasks" | "publications";

interface DeletedItem {
  type: "client" | "task" | "publication";
  id: string;
  content: string;
  deleted_at: string;
}

export const TrashDialog = () => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | DeletedItem["type"]>("all");

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

  const filteredItems = deletedItems.filter(item => {
    const matchesSearch = item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesType;
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
      
      toast({
        title: "Elemento restaurado",
        description: "El elemento ha sido restaurado exitosamente.",
      });
    } catch (error) {
      console.error('Error restoring item:', error);
      toast({
        title: "Error",
        description: "No se pudo restaurar el elemento. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 mr-2"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold dark:text-white">
            Papelera
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar elementos eliminados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Tabs defaultValue="all" onValueChange={(value) => setSelectedType(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="client">Clientes</TabsTrigger>
              <TabsTrigger value="task">Tareas</TabsTrigger>
              <TabsTrigger value="publication">Publicaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    No hay elementos eliminados
                  </p>
                ) : (
                  filteredItems.map((item) => (
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
            </TabsContent>

            {["client", "task", "publication"].map((type) => (
              <TabsContent key={type} value={type} className="mt-4">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {filteredItems.filter(item => item.type === type).length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400">
                      No hay {type === "client" ? "clientes" : type === "task" ? "tareas" : "publicaciones"} eliminados
                    </p>
                  ) : (
                    filteredItems
                      .filter(item => item.type === type)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
                        >
                          <div className="flex-1">
                            <p className="font-medium dark:text-white">{item.content}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};