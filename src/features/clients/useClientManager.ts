import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Client } from "@/components/ClientList";
import { toast } from "@/hooks/use-toast";
import { convertClientForDatabase, convertDatabaseClient } from "@/lib/database-types";

export const useClientManager = () => {
  const [clients, setClients] = useState<Client[]>([]);

  const loadClients = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*');
      
      if (clientsError) throw clientsError;
      if (clientsData) {
        const formattedClients = clientsData.map((client: Record<string, unknown>) => 
          convertDatabaseClient(client)
        );
        setClients(formattedClients);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const addClient = async (clientData: any) => {
    const newClient: Client = {
      id: crypto.randomUUID(),
      name: clientData.name,
      phone: clientData.phone,
      paymentDay: parseInt(clientData.nextPayment),
      marketingInfo: clientData.marketingInfo,
      instagram: clientData.instagram || "",
      facebook: clientData.facebook || "",
      packages: [{
        id: crypto.randomUUID(),
        name: "Paquete Inicial",
        totalPublications: parseInt(clientData.publications),
        usedPublications: 0,
        month: clientData.packageMonth,
        paid: false
      }]
    };

    try {
      const { error } = await supabase
        .from('clients')
        .insert([convertClientForDatabase(newClient)]);
      
      if (error) throw error;

      setClients((prev) => [newClient, ...prev]);
      toast({
        title: "Cliente agregado",
        description: "El cliente se ha guardado en la nube.",
      });

    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (clientError) throw clientError;

      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('clientId', id);
      
      if (tasksError) throw tasksError;

      setClients((prev) => prev.filter((client) => client.id !== id));
      
      toast({
        title: "Cliente eliminado",
        description: "El cliente y sus tareas asociadas han sido eliminados de la nube.",
      });

    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const updatePackage = async (clientId: string, packageId: string, usedPublications: number) => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const updatedClient = {
        ...client,
        packages: client.packages.map(pkg => {
          if (pkg.id === packageId) {
            return {
              ...pkg,
              usedPublications
            };
          }
          return pkg;
        })
      };

      const { error } = await supabase
        .from('clients')
        .update(convertClientForDatabase(updatedClient))
        .eq('id', clientId);
      
      if (error) throw error;

      setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));

    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paquete. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  return {
    clients,
    loadClients,
    addClient,
    deleteClient,
    updatePackage
  };
};