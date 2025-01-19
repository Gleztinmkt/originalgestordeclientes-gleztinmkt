import { useEffect, useState } from "react";
import { TaskInput } from "@/components/TaskInput";
import { TaskList } from "@/components/TaskList";
import { ClientList } from "@/components/ClientList";
import { ClientForm } from "@/components/ClientForm";
import { TaskFilter } from "@/components/TaskFilter";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TrashDialog } from "@/components/trash/TrashDialog";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTaskManager } from "@/features/tasks/useTaskManager";
import { useClientManager } from "@/features/clients/useClientManager";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { CalendarView } from "@/components/calendar/CalendarView";

const Index = () => {
  const { tasks, loadTasks, addTask, deleteTask, updateTask, completeTask } = useTaskManager();
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
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadClients(), loadTasks()]);
      // Simulate minimum loading time for better UX
      setTimeout(() => setIsLoading(false), 1000);
    };
    init();
  }, []);

  const handleFilterChange = (type: string | null, clientId: string | null) => {
    setSelectedType(type);
    setSelectedClientId(clientId);
  };

  const handleCompleteTask = async (id: string) => {
    try {
      await completeTask(id);
      toast({
        title: "Tarea actualizada",
        description: "El estado de la tarea ha sido actualizado.",
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (selectedType && task.type !== selectedType) return false;
    if (selectedClientId && task.clientId !== selectedClientId) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="content">
          <h1>Gestor de clientes</h1>
          <img 
            src="https://i.imgur.com/YvEDrAv.png" 
            alt="Gleztin Marketing Digital" 
            className="animate-pulse"
          />
          <div className="progress-bar">
            <div />
          </div>
          <div className="copyright">
            Copyright {new Date().getFullYear()} - Gleztin Marketing Digital
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen p-4 md:p-8 space-y-6 md:space-y-8 dark:bg-gray-900 dark:text-white transition-colors duration-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrashDialog />
            <NotificationCenter 
              onSendPaymentReminders={() => {}}
              onCompleteTask={() => {}}
            />
            <img 
              src="https://i.imgur.com/YvEDrAv.png" 
              alt="Gleztin Marketing Digital" 
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
        
        <div className="text-center space-y-4 mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold font-manrope text-gray-900 dark:text-white">
            Gestor de clientes Gleztin Marketing Digital
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Gestiona tus clientes y tareas de forma eficiente
          </p>
        </div>

        <Tabs defaultValue="clients" className="w-full max-w-[1200px] mx-auto">
          <TabsList className={`grid w-full grid-cols-3 rounded-2xl p-1 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm ${isMobile ? 'sticky top-2 z-10' : ''}`}>
            <TabsTrigger value="clients" className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
              Clientes
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
              Tareas
            </TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
              Calendario
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
              onCompleteTask={handleCompleteTask}
              onUpdateTask={updateTask}
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
              onCompleteTask={handleCompleteTask}
              onUpdateTask={updateTask}
              clients={clients}
            />
          </TabsContent>
          <TabsContent value="calendar" className="mt-6">
            <CalendarView clients={clients} />
          </TabsContent>
        </Tabs>
      </div>
    </ThemeProvider>
  );
};

export default Index;
