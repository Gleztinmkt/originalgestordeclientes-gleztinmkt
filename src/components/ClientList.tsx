import { useState, useEffect } from "react";
import { BulkMessageButton } from "./client/BulkMessageButton";
import { ClientFilter } from "./client/ClientFilter";
import { ClientCard } from "./client/ClientCard";
import { Task } from "./TaskList";
import { Client } from "./types/client";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Grid3x3, List, Search, DollarSign, Link as LinkIcon, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ClientLink {
  id: string;
  client_id: string;
  access_token: string;
}

interface ClientListProps {
  clients: Client[];
  onDeleteClient: (id: string) => void;
  onUpdateClient: (id: string, data: any) => void;
  onUpdatePackage: (clientId: string, packageId: string, usedPublications: number) => void;
  onAddPackage: (clientId: string, packageData: any) => void;
  tasks: Task[];
  onAddTask: (content: string, clientId?: string) => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onUpdateTask: (id: string, task: Partial<Task>) => void;
}

export const ClientList = ({ 
  clients, 
  onDeleteClient, 
  onUpdateClient,
  onUpdatePackage,
  onAddPackage,
  tasks,
  onAddTask,
  onDeleteTask,
  onCompleteTask,
  onUpdateTask
}: ClientListProps) => {
  const [selectedPaymentDay, setSelectedPaymentDay] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showPendingPayments, setShowPendingPayments] = useState(false);
  const [clientLinks, setClientLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchClientLinks();
  }, [clients]);

  const fetchClientLinks = async () => {
    try {
      const { data: links, error } = await supabase
        .from('client_links')
        .select('*')
        .is('deleted_at', null);

      if (error) throw error;

      const linkMap = (links || []).reduce((acc: Record<string, string>, link: ClientLink) => {
        acc[link.client_id] = link.access_token;
        return acc;
      }, {});

      setClientLinks(linkMap);
    } catch (error) {
      console.error('Error fetching client links:', error);
    }
  };

  const generateClientLink = async (clientId: string) => {
    try {
      const accessToken = crypto.randomUUID();
      
      const { error } = await supabase
        .from('client_links')
        .insert({
          client_id: clientId,
          access_token: accessToken
        });

      if (error) {
        console.error('Error generating client link:', error);
        throw error;
      }

      // Update local state after successful insertion
      setClientLinks(prev => ({
        ...prev,
        [clientId]: accessToken
      }));

      toast({
        title: "Enlace generado",
        description: "Se ha generado un nuevo enlace de acceso para el cliente.",
      });
    } catch (error) {
      console.error('Error generating client link:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el enlace. Por favor, intente de nuevo.",
        variant: "destructive",
      });
    }
  };

  const copyClientLink = (clientId: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/client/${clientLinks[clientId]}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Enlace copiado",
      description: "El enlace ha sido copiado al portapapeles.",
    });
  };

  const getSubtleGradient = (index: number) => {
    const gradients = [
      'bg-gradient-to-br from-blue-50 to-indigo-50',
      'bg-gradient-to-br from-purple-50 to-pink-50',
      'bg-gradient-to-br from-green-50 to-emerald-50',
      'bg-gradient-to-br from-yellow-50 to-amber-50',
      'bg-gradient-to-br from-red-50 to-orange-50'
    ];
    return gradients[index % gradients.length];
  };

  const filteredClients = clients
    .filter(client => {
      if (showPendingPayments) {
        return client.packages.some(pkg => !pkg.paid);
      }
      return true;
    })
    .filter(client => selectedPaymentDay === "all" || client.paymentDay === parseInt(selectedPaymentDay))
    .filter(client => 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.marketingInfo?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <ClientFilter onFilterChange={setSelectedPaymentDay} />
          <Button
            variant={showPendingPayments ? "default" : "outline"}
            onClick={() => setShowPendingPayments(!showPendingPayments)}
            className="gap-2 bg-transparent dark:text-white dark:hover:bg-gray-800"
          >
            <DollarSign className="h-4 w-4" />
            Pagos pendientes
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-background border border-input rounded-lg p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0 bg-transparent dark:text-white dark:hover:bg-gray-800"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0 bg-transparent dark:text-white dark:hover:bg-gray-800"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </div>
          <BulkMessageButton 
            clients={clients}
            selectedPaymentDay={selectedPaymentDay !== "all" ? parseInt(selectedPaymentDay) : undefined}
          />
        </div>
      </div>

      <div className={viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
        : "space-y-6"
      }>
        {filteredClients.map((client, index) => (
          <div key={client.id} className={getSubtleGradient(index)}>
            <div className="p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading font-semibold text-gray-800 dark:text-white">
                  {client.name}
                </h3>
                <div className="flex items-center gap-2">
                  {clientLinks[client.id] ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyClientLink(client.id)}
                      className="gap-2 bg-transparent dark:text-white dark:hover:bg-gray-800"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar enlace
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateClientLink(client.id)}
                      className="gap-2 bg-transparent dark:text-white dark:hover:bg-gray-800"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Generar enlace
                    </Button>
                  )}
                </div>
              </div>
              <ClientCard
                client={client}
                onDeleteClient={onDeleteClient}
                onUpdateClient={onUpdateClient}
                onUpdatePackage={onUpdatePackage}
                onAddPackage={onAddPackage}
                tasks={tasks}
                onAddTask={onAddTask}
                onDeleteTask={onDeleteTask}
                onCompleteTask={onCompleteTask}
                onUpdateTask={onUpdateTask}
                viewMode={viewMode}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};