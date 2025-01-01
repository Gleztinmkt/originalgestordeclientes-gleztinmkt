import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Client } from "@/components/ClientList";
import { toast } from "@/hooks/use-toast";
import { convertClientForDatabase, convertDatabaseClient, DatabaseClient } from "@/lib/database-types";

export const useClientManager = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (clientsError) throw clientsError;

      if (clientsData) {
        const formattedClients = clientsData.map(client => convertDatabaseClient(client as DatabaseClient));
        setClients(formattedClients);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addClient = async (clientData: any) => {
    try {
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

      const dbClient = convertClientForDatabase(newClient);
      const { error } = await supabase
        .from('clients')
        .insert(dbClient);
      
      if (error) throw error;

      setClients(prev => [newClient, ...prev]);
      toast({
        title: "Cliente agregado",
        description: "El cliente se ha guardado correctamente.",
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
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      setClients(prev => prev.filter(client => client.id !== id));
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente.",
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

      const dbClient = convertClientForDatabase(updatedClient);
      const { error } = await supabase
        .from('clients')
        .update(dbClient)
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
    isLoading,
    loadClients,
    addClient,
    deleteClient,
    updatePackage
  };
};