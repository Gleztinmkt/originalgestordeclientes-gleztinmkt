
import { useState } from "react";
import { Client } from "@/components/types/client";
import { toast } from "@/hooks/use-toast";
import { fetchClients, createClient, updateClient, deleteClient } from "./clientApi";

export const useClientManager = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const loadedClients = await fetchClients();
      console.log('Clientes cargados:', loadedClients);
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
      console.log('Agregando cliente:', clientData);
      const newClient = await createClient({
        name: clientData.name,
        phone: clientData.phone,
        paymentDay: parseInt(clientData.nextPayment),
        marketingInfo: clientData.marketingInfo || "",
        instagram: clientData.instagram || "",
        facebook: clientData.facebook || "",
        packages: []
      });

      console.log('Cliente agregado:', newClient);
      // Use functional update to avoid race conditions
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
    if (isUpdating) return Promise.reject("Operación en curso");
    
    try {
      setIsUpdating(true);
      await deleteClient(id);
      // Use functional update to avoid race conditions
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
      // Recargar los clientes para asegurar consistencia
      await loadClients();
    } finally {
      setIsUpdating(false);
    }
    
    return Promise.resolve();
  };

  const updateClientData = async (id: string, data: Partial<Client>) => {
    if (isUpdating) return Promise.reject("Operación en curso");
    
    try {
      setIsUpdating(true);
      console.log('Actualizando cliente:', id, data);
      
      const existingClient = clients.find(c => c.id === id);
      if (!existingClient) {
        throw new Error('Cliente no encontrado');
      }

      // Create a new object with deep copies to ensure immutability
      const mergedData = {
        ...existingClient,
        ...data,
        clientInfo: data.clientInfo ? {
          ...existingClient.clientInfo,
          ...data.clientInfo,
        } : existingClient.clientInfo,
        // Make sure we're creating a new array for packages
        packages: data.packages ? 
          // Convert any string numbers to actual numbers if needed
          data.packages.map(pkg => ({
            ...pkg,
            totalPublications: typeof pkg.totalPublications === 'string' ? 
              parseInt(pkg.totalPublications) : pkg.totalPublications,
            usedPublications: typeof pkg.usedPublications === 'string' ? 
              parseInt(pkg.usedPublications) : pkg.usedPublications,
            // Asegurar que se incluye el timestamp de la última actualización
            last_update: new Date().toISOString()
          })) : 
          [...existingClient.packages]
      };

      console.log('Datos fusionados:', mergedData);
      const updatedClient = await updateClient(id, mergedData);
      console.log('Cliente actualizado:', updatedClient);
      
      // Optimistic update with immutable data patterns
      setClients(prev => prev.map(c => c.id === id ? {...updatedClient} : c));
      
      toast({
        title: "Cliente actualizado",
        description: "La información del cliente se ha actualizado correctamente.",
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      // Recargar los clientes para asegurar consistencia
      await loadClients();
      
      return Promise.reject(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePackage = async (clientId: string, packageId: string, usedPublications: number) => {
    if (isUpdating) return Promise.reject("Operación en curso");
    
    try {
      setIsUpdating(true);
      console.log(`Actualizando paquete: clientId=${clientId}, packageId=${packageId}, usedPublications=${usedPublications}`);
      
      const client = clients.find(c => c.id === clientId);
      if (!client) {
        console.error('Cliente no encontrado:', clientId);
        return Promise.reject("Cliente no encontrado");
      }

      // Create a new array of packages with the updated package
      const updatedPackages = client.packages.map(pkg => 
        pkg.id === packageId ? { 
          ...pkg, 
          usedPublications,
          // Agregar timestamp de la última actualización
          last_update: new Date().toISOString()
        } : {...pkg}
      );

      console.log('Paquetes actualizados:', updatedPackages);
      
      // Usar función de actualización de cliente para garantizar persistencia
      await updateClientData(clientId, { packages: updatedPackages });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paquete. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      // Recargar los clientes para asegurar consistencia
      await loadClients();
      
      return Promise.reject(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const addPackage = async (clientId: string, packageData: any) => {
    if (isUpdating) return Promise.reject("Operación en curso");
    
    try {
      setIsUpdating(true);
      console.log('Agregando paquete:', clientId, packageData);
      const client = clients.find(c => c.id === clientId);
      if (!client) {
        console.error('Cliente no encontrado:', clientId);
        return Promise.reject("Cliente no encontrado");
      }

      // Ensure numeric values
      const newPackage = {
        ...packageData,
        totalPublications: typeof packageData.totalPublications === 'string' ? 
          parseInt(packageData.totalPublications) : packageData.totalPublications,
        usedPublications: typeof packageData.usedPublications === 'string' ? 
          parseInt(packageData.usedPublications) : packageData.usedPublications,
        // Agregar timestamp de la creación
        last_update: new Date().toISOString()
      };

      // Create a new array with the new package
      const updatedPackages = [...client.packages, newPackage];
      await updateClientData(clientId, { packages: updatedPackages });
      console.log('Paquete agregado exitosamente');
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding package:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el paquete. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      // Recargar los clientes para asegurar consistencia
      await loadClients();
      
      return Promise.reject(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    clients,
    isLoading,
    isUpdating,
    loadClients,
    addClient,
    updateClient: updateClientData,
    deleteClient: deleteClientData,
    updatePackage,
    addPackage
  };
};
