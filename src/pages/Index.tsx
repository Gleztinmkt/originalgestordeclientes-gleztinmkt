import { useEffect } from "react";
import { TaskInput } from "@/components/TaskInput";
import { TaskList } from "@/components/TaskList";
import { ClientList } from "@/components/ClientList";
import { ClientForm } from "@/components/ClientForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTaskManager } from "@/features/tasks/useTaskManager";
import { useClientManager } from "@/features/clients/useClientManager";

const Index = () => {
  const { tasks, loadTasks, addTask, deleteTask } = useTaskManager();
  const { clients, loadClients, addClient, deleteClient, updatePackage } = useClientManager();

  useEffect(() => {
    loadClients();
    loadTasks();
  }, []);

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
          <ClientForm onAddClient={addClient} />
          <ClientList 
            clients={clients} 
            onDeleteClient={deleteClient}
            onUpdatePackage={updatePackage}
          />
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4 mt-6">
          <TaskInput onAddTask={addTask} />
          <TaskList 
            tasks={tasks} 
            onDeleteClient={deleteTask}
            clients={clients}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;