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
import { UserManagement } from "@/components/UserManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTaskManager } from "@/features/tasks/useTaskManager";
import { useClientManager } from "@/features/clients/useClientManager";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { CalendarView } from "@/components/calendar/CalendarView";
import { PlanningCalendar } from "@/components/planning/PlanningCalendar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

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
  const navigate = useNavigate();

  // Fetch user role
  const { data: userRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      return roleData?.role || null;
    },
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente"
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadClients(), loadTasks()]);
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
      <div className="loading-screen fixed inset-0 flex items-center justify-center w-full h-full" style={{
        backgroundImage: 'url(https://i.imgur.com/w73iJfK.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="content bg-white/90 dark:bg-gray-800/90 p-6 rounded-lg shadow-lg backdrop-blur-sm w-[90%] max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Gestor de clientes</h1>
          <img 
            src="https://i.imgur.com/YvEDrAv.png" 
            alt="Gleztin Marketing Digital" 
            className="w-24 h-24 mx-auto object-contain animate-pulse"
          />
          <div className="progress-bar mt-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-2 bg-blue-500 dark:bg-blue-400 animate-progress" />
          </div>
          <div className="copyright mt-4 text-sm text-gray-600 dark:text-gray-400">
            Copyright {new Date().getFullYear()} - Gleztin Marketing Digital
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-gray-900 dark:text-white transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              {userRole === 'admin' && (
                <>
                  <TrashDialog />
                  <NotificationCenter 
                    onSendPaymentReminders={() => {}}
                    onCompleteTask={() => {}}
                  />
                </>
              )}
              <img 
                src="https://i.imgur.com/YvEDrAv.png" 
                alt="Gleztin Marketing Digital" 
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              {userRole === 'admin' && <UserManagement />}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <LogOut className="h-5 w-5" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
          
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold font-manrope text-gray-900 dark:text-white">
              Gestor de clientes Gleztin Marketing Digital
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Gestiona tus clientes y tareas de forma eficiente
            </p>
          </div>
          
          <Tabs defaultValue={userRole === 'admin' ? "clients" : "calendar"} className="w-full">
            <TabsList className={`grid w-full ${userRole === 'admin' ? 'grid-cols-4' : 'grid-cols-1'} rounded-2xl p-1 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm ${isMobile ? 'sticky top-2 z-10' : ''}`}>
              {userRole === 'admin' && (
                <>
                  <TabsTrigger value="clients" className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
                    Clientes
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
                    Tareas
                  </TabsTrigger>
                  <TabsTrigger value="planning" className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
                    Planificación
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="calendar" className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
                Calendario
              </TabsTrigger>
            </TabsList>
            <div className="mt-6 w-full">
              {userRole === 'admin' && (
                <>
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
                  <TabsContent value="planning">
                    <PlanningCalendar clients={clients} />
                  </TabsContent>
                </>
              )}
              <TabsContent value="calendar">
                <CalendarView clients={clients} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;