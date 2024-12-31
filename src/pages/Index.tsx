import { useState, useEffect } from "react";
import { TaskInput } from "@/components/TaskInput";
import { TaskList, Task } from "@/components/TaskList";
import { ClientList, Client } from "@/components/ClientList";
import { ClientForm } from "@/components/ClientForm";
import { analyzeTask } from "@/lib/task-analyzer";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

// Define database types to match Supabase schema
interface DatabaseClient extends Omit<Client, 'packages'> {
  packages: string; // JSON string in database
}

interface DatabaseTask extends Task {}

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Cargar datos iniciales de Supabase
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Cargar clientes
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*');
        
        if (clientsError) throw clientsError;
        if (clientsData) {
          // Convert database format to application format
          const formattedClients: Client[] = clientsData.map((client: DatabaseClient) => ({
            ...client,
            packages: JSON.parse(client.packages || '[]'),
          }));
          setClients(formattedClients);
        }

        // Cargar tareas
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*');
        
        if (tasksError) throw tasksError;
        if (tasksData) {
          setTasks(tasksData as Task[]);
        }

      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
      }
    };

    loadInitialData();
  }, []);

  const handleAddTask = async (content: string) => {
    const analysis = analyzeTask(content);
    const newTask: Task = {
      id: crypto.randomUUID(),
      content,
      ...analysis,
      clientId: analysis.clientId || null,
    };

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          id: newTask.id,
          content: newTask.content,
          type: newTask.type,
          clientId: newTask.clientId,
        }]);
      
      if (error) throw error;

      setTasks((prev) => [newTask, ...prev]);
      toast({
        title: "Tarea agregada",
        description: "La tarea se ha guardado en la nube.",
      });

    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la tarea. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleAddClient = async (clientData: any) => {
    const newClient: Client = {
      id: crypto.randomUUID(),
      name: clientData.name,
      phone: clientData.phone,
      paymentDay: parseInt(clientData.nextPayment),
      marketingInfo: clientData.marketingInfo,
      instagram: clientData.instagram || "",
      facebook: clientData.facebook || "",
      packages: [{
        id: crypto.randomUUID(),
        name: "Paquete Inicial",
        totalPublications: parseInt(clientData.publications),
        usedPublications: 0,
        month: clientData.packageMonth,
        paid: false
      }]
    };

    try {
      const { error } = await supabase
        .from('clients')
        .insert([{
          id: newClient.id,
          name: newClient.name,
          phone: newClient.phone,
          paymentDay: newClient.paymentDay,
          marketingInfo: newClient.marketingInfo,
          instagram: newClient.instagram,
          facebook: newClient.facebook,
          packages: JSON.stringify(newClient.packages),
        }]);
      
      if (error) throw error;

      setClients((prev) => [newClient, ...prev]);
      toast({
        title: "Cliente agregado",
        description: "El cliente se ha guardado en la nube.",
      });

    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      setTasks((prev) => prev.filter((task) => task.id !== id));
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada de la nube.",
      });

    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      // Eliminar el cliente
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (clientError) throw clientError;

      // Eliminar tareas asociadas
      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('clientId', id);
      
      if (tasksError) throw tasksError;

      setClients((prev) => prev.filter((client) => client.id !== id));
      setTasks((prev) => prev.filter((task) => task.clientId !== id));
      
      toast({
        title: "Cliente eliminado",
        description: "El cliente y sus tareas asociadas han sido eliminados de la nube.",
      });

    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePackage = async (clientId: string, packageId: string, usedPublications: number) => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const updatedClient = {
        ...client,
        packages: client.packages.map(pkg => {
          if (pkg.id === packageId) {
            return {
              ...pkg,
              usedPublications
            };
          }
          return pkg;
        })
      };

      const { error } = await supabase
        .from('clients')
        .update({
          ...updatedClient,
          packages: JSON.stringify(updatedClient.packages),
        })
        .eq('id', clientId);
      
      if (error) throw error;

      setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));

    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paquete. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen p-8 space-y-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold font-heading text-gray-900">
          Gestor de clientes Gleztin Marketing Digital
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Gestiona tus clientes y tareas de forma eficiente
        </p>
      </div>

      <Tabs defaultValue="clients" className="w-full max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-white/70 backdrop-blur-sm">
          <TabsTrigger value="clients" className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white">
            Clientes
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white">
            Tareas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="clients" className="space-y-4 mt-6">
          <ClientForm onAddClient={handleAddClient} />
          <ClientList 
            clients={clients} 
            onDeleteClient={handleDeleteClient}
            onUpdatePackage={handleUpdatePackage}
          />
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4 mt-6">
          <TaskInput onAddTask={handleAddTask} />
          <TaskList 
            tasks={tasks} 
            onDeleteTask={handleDeleteTask}
            clients={clients}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;