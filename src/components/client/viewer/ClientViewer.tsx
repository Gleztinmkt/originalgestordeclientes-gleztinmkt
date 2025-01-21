import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Client } from "@/components/types/client";
import { Task } from "@/components/TaskList";
import { Publication } from "@/components/client/publication/types";
import { supabase } from "@/integrations/supabase/client";
import { ClientPackage } from "../ClientPackage";
import { TaskList } from "@/components/TaskList";
import { CalendarView } from "@/components/calendar/CalendarView";

export const ClientViewer = ({ clientId }: { clientId: string }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (clientError) throw clientError;
        if (clientData) {
          setClient(clientData as Client);
        }

        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('client_id', clientId)
          .is('deleted_at', null)
          .eq('completed', false);

        if (tasksError) throw tasksError;
        if (tasksData) {
          setTasks(tasksData as Task[]);
        }

      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  if (isLoading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  if (!client) {
    return <div className="p-8 text-center">Cliente no encontrado</div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6 dark:bg-gray-900">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{client.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="packages">
            <TabsList>
              <TabsTrigger value="packages">Paquetes</TabsTrigger>
              <TabsTrigger value="tasks">Tareas</TabsTrigger>
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
            </TabsList>
            <TabsContent value="packages" className="space-y-4">
              {client.packages.map((pkg) => (
                <ClientPackage
                  key={pkg.id}
                  client={client}
                  package={pkg}
                  onUpdatePackage={() => {}}
                  onEditPackage={() => {}}
                  onDeletePackage={() => {}}
                  viewOnly
                />
              ))}
            </TabsContent>
            <TabsContent value="tasks">
              <TaskList
                tasks={tasks}
                onDeleteTask={() => {}}
                onCompleteTask={() => {}}
                onUpdateTask={() => {}}
                clients={[]}
                viewOnly
              />
            </TabsContent>
            <TabsContent value="calendar">
              <CalendarView clients={[client]} viewOnly />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};