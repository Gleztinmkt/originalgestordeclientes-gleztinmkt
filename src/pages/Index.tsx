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
import { UserManagement } from "@/components/settings/UserManagement";
import { supabase } from "@/integrations/supabase/client";

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
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Verificar la sesión primero
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = '/login';
          return;
        }

        // Cargar datos en paralelo
        await Promise.all([loadClients(), loadTasks()]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al cargar los datos. Por favor, recarga la página.');
        toast({
          title: "Error",
          description: "Hubo un problema al cargar los datos. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        // Asegurar un tiempo mínimo de carga para mejor UX
        setTimeout(() => setIsLoading(false), 500);
      }
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

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
            <UserManagement />
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
          <div className="section-container mt-6">
            <TabsContent value="clients" className="space-y-4">
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
            <TabsContent value="tasks" className="space-y-4">
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
            <TabsContent value="calendar">
              <CalendarView clients={clients} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </ThemeProvider>
  );
};

export default Index;