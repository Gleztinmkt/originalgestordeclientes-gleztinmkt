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

interface DatabasePackage {
  id: string;
  name: string;
  totalPublications: number;
  usedPublications: number;
  month: string;
  paid: boolean;
}

interface DatabaseClientInfo {
  generalInfo: string;
  meetings: Array<{ date: string; notes: string; }>;
  socialNetworks: Array<{ platform: SocialPlatform; username: string; }>;
}

export const ClientViewer = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const linkId = urlParams.get('id');

        if (!linkId) {
          setError('Link inválido');
          setIsLoading(false);
          return;
        }

        const { data: linkData, error: linkError } = await supabase
          .from('client_links')
          .select('client_id')
          .eq('unique_id', linkId)
          .eq('is_active', true)
          .single();

        if (linkError || !linkData?.client_id) {
          console.error('Error fetching client link:', linkError);
          setError('Link no encontrado o inactivo');
          setIsLoading(false);
          return;
        }

        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', linkData.client_id)
          .single();

        if (clientError || !clientData) {
          console.error('Error fetching client:', clientError);
          setError('Cliente no encontrado');
          setIsLoading(false);
          return;
        }

        // Safe type assertion after validation
        const rawPackages = clientData.packages as Record<string, any>[] || [];
        const packages: DatabasePackage[] = rawPackages.map(pkg => ({
          id: String(pkg.id || crypto.randomUUID()),
          name: String(pkg.name || ""),
          totalPublications: Number(pkg.totalPublications || 0),
          usedPublications: Number(pkg.usedPublications || 0),
          month: String(pkg.month || ""),
          paid: Boolean(pkg.paid)
        }));

        // Safe type assertion for client info
        const rawClientInfo = clientData.client_info as Record<string, any> || {};
        const clientInfo: DatabaseClientInfo = {
          generalInfo: String(rawClientInfo.generalInfo || ""),
          meetings: Array.isArray(rawClientInfo.meetings) 
            ? rawClientInfo.meetings.map((m: any) => ({
                date: String(m.date || ""),
                notes: String(m.notes || "")
              }))
            : [],
          socialNetworks: Array.isArray(rawClientInfo.socialNetworks)
            ? rawClientInfo.socialNetworks.map((s: any) => ({
                platform: String(s.platform || "instagram") as SocialPlatform,
                username: String(s.username || "")
              }))
            : []
        };

        const formattedClient: Client = {
          id: clientData.id,
          name: clientData.name,
          phone: clientData.phone || "",
          paymentDay: clientData.payment_day || 1,
          marketingInfo: clientData.marketing_info || "",
          instagram: clientData.instagram || "",
          facebook: clientData.facebook || "",
          packages,
          clientInfo
        };

        setClient(formattedClient);

        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('client_id', linkData.client_id)
          .is('deleted_at', null)
          .eq('completed', false);

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
        } else if (tasksData) {
          setTasks(tasksData.map(task => convertDatabaseTask({
            ...task,
            type: task.type as Task["type"]
          })));
        }

      } catch (error) {
        console.error('Error in client viewer:', error);
        setError('Error al cargar los datos del cliente');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-500">{error || 'Error al cargar el cliente'}</p>
      </div>
    );
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