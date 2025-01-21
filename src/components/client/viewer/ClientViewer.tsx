import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Client, SocialPlatform } from "@/components/types/client";
import { Task } from "@/components/types/task";
import { supabase } from "@/integrations/supabase/client";
import { ClientPackage } from "../ClientPackage";
import { TaskList } from "@/components/TaskList";
import { CalendarView } from "@/components/calendar/CalendarView";
import { convertDatabaseTask } from "@/lib/database-types";
import { Json } from "@/integrations/supabase/types";

interface DatabasePackage {
  id?: string;
  name?: string;
  totalPublications?: string | number;
  usedPublications?: string | number;
  month?: string;
  paid?: boolean;
}

interface DatabaseClientInfo {
  generalInfo?: string;
  meetings?: Array<{ date: string; notes: string; }>;
  socialNetworks?: Array<{ platform: SocialPlatform; username: string; }>;
}

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
          const packages = Array.isArray(clientData.packages) 
            ? (clientData.packages as DatabasePackage[]).map(pkg => ({
                id: pkg.id || crypto.randomUUID(),
                name: pkg.name || "",
                totalPublications: typeof pkg.totalPublications === 'string' 
                  ? parseInt(pkg.totalPublications) 
                  : pkg.totalPublications || 0,
                usedPublications: typeof pkg.usedPublications === 'string'
                  ? parseInt(pkg.usedPublications)
                  : pkg.usedPublications || 0,
                month: pkg.month || "",
                paid: Boolean(pkg.paid)
              }))
            : [];

          const clientInfo = clientData.client_info as DatabaseClientInfo;
          
          setClient({
            id: clientData.id,
            name: clientData.name,
            phone: clientData.phone || "",
            paymentDay: clientData.payment_day || 1,
            marketingInfo: clientData.marketing_info || "",
            instagram: clientData.instagram || "",
            facebook: clientData.facebook || "",
            packages,
            clientInfo: {
              generalInfo: clientInfo?.generalInfo || "",
              meetings: Array.isArray(clientInfo?.meetings) ? clientInfo.meetings : [],
              socialNetworks: Array.isArray(clientInfo?.socialNetworks) 
                ? clientInfo.socialNetworks.map(network => ({
                    platform: network.platform || "instagram",
                    username: network.username || ""
                  }))
                : []
            }
          });
        }

        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('client_id', clientId)
          .is('deleted_at', null)
          .eq('completed', false);

        if (tasksError) throw tasksError;
        if (tasksData) {
          setTasks(tasksData.map(task => convertDatabaseTask({
            ...task,
            type: task.type as Task["type"]
          })));
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
                  packageName={pkg.name}
                  totalPublications={pkg.totalPublications}
                  usedPublications={pkg.usedPublications}
                  month={pkg.month}
                  paid={pkg.paid}
                  onUpdateUsed={async () => {}}
                  onUpdatePaid={async () => {}}
                  onEditPackage={async () => {}}
                  onDeletePackage={async () => {}}
                  clientId={client.id}
                  clientName={client.name}
                  packageId={pkg.id}
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