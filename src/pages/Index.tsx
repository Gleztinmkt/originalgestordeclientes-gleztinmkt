
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTaskManager } from "@/features/tasks/useTaskManager";
import { useClientManager } from "@/features/clients/useClientManager";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { MainContent } from "@/components/layout/MainContent";

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

  const { data: userRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return null;
      }

      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return roleData?.role || null;
    },
    retry: false,
    meta: {
      onError: () => {
        navigate('/login');
      }
    }
  });

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([loadClients(), loadTasks()]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: "Error de carga",
          description: "No se pudieron cargar los datos. Por favor, recarga la página.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      init();
    };

    checkSession();
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

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-gray-900 dark:text-white transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          <Header userRole={userRole} />
          
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
              <MainContent 
                userRole={userRole}
                clients={clients}
                tasks={tasks}
                filteredTasks={filteredTasks}
                selectedType={selectedType}
                selectedClientId={selectedClientId}
                onAddClient={addClient}
                onDeleteClient={deleteClient}
                onUpdateClient={updateClient}
                onUpdatePackage={updatePackage}
                onAddPackage={addPackage}
                onAddTask={addTask}
                onDeleteTask={deleteTask}
                onCompleteTask={completeTask}
                onUpdateTask={updateTask}
                onFilterChange={handleFilterChange}
              />
            </div>
          </Tabs>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;
