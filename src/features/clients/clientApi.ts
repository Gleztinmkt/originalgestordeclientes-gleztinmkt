import { supabase } from "@/lib/supabase";
import { Client } from "@/components/types/client";
import { formatClientForDatabase, formatDatabaseClient } from "@/lib/database-utils";

export const fetchClients = async () => {
  const { data: clientsData, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error('No se pudieron cargar los clientes');
  }

  return clientsData?.map(client => formatDatabaseClient(client)) || [];
};

export const createClient = async (clientData: Partial<Client>) => {
  const { data, error } = await supabase
    .from('clients')
    .insert(formatClientForDatabase(clientData))
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw new Error('No se pudo crear el cliente');
  }

  return formatDatabaseClient(data);
};

export const updateClient = async (id: string, clientData: Partial<Client>) => {
  const { data, error } = await supabase
    .from('clients')
    .update(formatClientForDatabase(clientData))
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw new Error('No se pudo actualizar el cliente');
  }

  return formatDatabaseClient(data);
};

export const deleteClient = async (id: string) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting client:', error);
    throw new Error('No se pudo eliminar el cliente');
  }
};