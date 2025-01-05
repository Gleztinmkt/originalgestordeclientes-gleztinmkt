import { useEffect, useState } from "react";
import { TaskInput } from "@/components/TaskInput";
import { TaskList } from "@/components/TaskList";
import { ClientList } from "@/components/ClientList";
import { ClientForm } from "@/components/ClientForm";
import { TaskFilter } from "@/components/TaskFilter";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTaskManager } from "@/features/tasks/useTaskManager";
import { useClientManager } from "@/features/clients/useClientManager";

const Index = () => {
  const { tasks, loadTasks, addTask, deleteTask } = useTaskManager();
  const { 
    clients, 
    loadClients, 
    addClient, 
    deleteClient, 
    updateClient,
    updatePackage,
    addPackage 
  } = useClientManager();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
    loadTasks();
  }, []);

  const handleFilterChange = (type: string | null, clientId: string | null) => {
    setSelectedType(type);
    setSelectedClientId(clientId);
  };

  const filteredTasks = tasks.filter(task => {
    if (selectedType && task.type !== selectedType) return false;
    if (selectedClientId && task.clientId !== selectedClientId) return false;
    return true;
  });

  return (
    <ThemeProvider>
      <div className="min-h-screen p-8 space-y-8 dark:bg-gray-900 dark:text-white transition-colors duration-200">
        <ThemeToggle />
        
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold font-heading text-gray-900 dark:text-white">
            Gestor de clientes Gleztin Marketing Digital
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Gestiona tus clientes y tareas de forma eficiente
          </p>
        </div>

        <Tabs defaultValue="clients" className="w-full max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <TabsTrigger value="clients" className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
              Clientes
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
              Tareas
            </TabsTrigger>
          </TabsList>
          <TabsContent value="clients" className="space-y-4 mt-6">
            <ClientForm onAddClient={addClient} />
            <ClientList 
              clients={clients} 
              onDeleteClient={deleteClient}
              onUpdateClient={updateClient}
              onUpdatePackage={updatePackage}
              onAddPackage={addPackage}
              tasks={tasks}
              onAddTask={addTask}
              onDeleteTask={deleteTask}
            />
          </TabsContent>
          <TabsContent value="tasks" className="space-y-4 mt-6">
            <TaskFilter 
              clients={clients}
              onFilterChange={handleFilterChange}
            />
            <TaskInput 
              onAddTask={addTask}
              clients={clients}
            />
            <TaskList 
              tasks={filteredTasks}
              onDeleteTask={deleteTask}
              clients={clients}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ThemeProvider>
  );
};

export default Index;