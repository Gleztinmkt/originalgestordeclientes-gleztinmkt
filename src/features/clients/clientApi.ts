import { supabase } from "@/lib/supabase";
import { Client } from "@/components/types/client";
import { formatClientForDatabase, formatDatabaseClient } from "@/lib/database-utils";

export const fetchClients = async () => {
  console.log('Fetching clients...');
  const { data: clientsData, error } = await supabase
    .from('clients')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error('No se pudieron cargar los clientes');
  }

  console.log('Clients fetched:', clientsData);
  return clientsData?.map(client => formatDatabaseClient(client)) || [];
};

export const createClient = async (clientData: Partial<Client>) => {
  console.log('Creating client with data:', clientData);
  const formattedData = formatClientForDatabase(clientData);
  console.log('Formatted data for database:', formattedData);

  const { data, error } = await supabase
    .from('clients')
    .insert(formattedData)
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw new Error('No se pudo crear el cliente');
  }

  console.log('Client created:', data);
  return formatDatabaseClient(data);
};

export const updateClient = async (id: string, clientData: Partial<Client>) => {
  console.log('Updating client:', id, clientData);
  const formattedData = formatClientForDatabase(clientData);
  console.log('Formatted data for database:', formattedData);

  const { data, error } = await supabase
    .from('clients')
    .update(formattedData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw new Error('No se pudo actualizar el cliente');
  }

  console.log('Client updated:', data);
  return formatDatabaseClient(data);
};

export const deleteClient = async (id: string) => {
  console.log('Deleting client:', id);
  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deleting client:', error);
    throw new Error('No se pudo eliminar el cliente');
  }
  console.log('Client deleted successfully');
};