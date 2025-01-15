import { useState } from "react";
import { Client } from "@/components/types/client";
import { toast } from "@/hooks/use-toast";
import { fetchClients, createClient, updateClient, deleteClient } from "./clientApi";

export const useClientManager = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const loadedClients = await fetchClients();
      setClients(loadedClients);
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
      const newClient = await createClient({
        name: clientData.name,
        phone: clientData.phone,
        paymentDay: parseInt(clientData.nextPayment),
        marketingInfo: clientData.marketingInfo || "",
        instagram: clientData.instagram || "",
        facebook: clientData.facebook || "",
        packages: []
      });

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

  const deleteClientData = async (id: string) => {
    try {
      await deleteClient(id);
      setClients(prev => prev.filter(client => client.id !== id));
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido movido a la papelera.",
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

  const updateClientData = async (id: string, data: Partial<Client>) => {
    try {
      // Find the existing client
      const existingClient = clients.find(c => c.id === id);
      if (!existingClient) {
        throw new Error('Cliente no encontrado');
      }

      // Merge the existing client data with the updates
      const mergedData = {
        ...existingClient,
        ...data,
        // Special handling for nested objects
        clientInfo: data.clientInfo ? {
          ...existingClient.clientInfo,
          ...data.clientInfo,
        } : existingClient.clientInfo,
        // Ensure packages are preserved unless explicitly updated
        packages: data.packages || existingClient.packages,
      };

      const updatedClient = await updateClient(id, mergedData);
      
      setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
      
      toast({
        title: "Cliente actualizado",
        description: "La información del cliente se ha actualizado correctamente.",
      });
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const updatePackage = async (clientId: string, packageId: string, usedPublications: number) => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const updatedPackages = client.packages.map(pkg => 
        pkg.id === packageId ? { ...pkg, usedPublications } : pkg
      );

      await updateClientData(clientId, { ...client, packages: updatedPackages });
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paquete. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const addPackage = async (clientId: string, packageData: any) => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const newPackage = {
        id: crypto.randomUUID(),
        name: packageData.name,
        totalPublications: parseInt(packageData.totalPublications),
        usedPublications: 0,
        month: packageData.month,
        paid: packageData.paid
      };

      const updatedPackages = [...client.packages, newPackage];
      await updateClientData(clientId, { ...client, packages: updatedPackages });
    } catch (error) {
      console.error('Error adding package:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el paquete. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  return {
    clients,
    isLoading,
    loadClients,
    addClient,
    updateClient: updateClientData,
    deleteClient: deleteClientData,
    updatePackage,
    addPackage
  };
};