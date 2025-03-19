
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

  // Asegurarnos de que el campo branding se incluya en client_info
  if (clientData.clientInfo?.branding !== undefined) {
    console.log('Updating branding URL:', clientData.clientInfo.branding);
  }

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
  
  // Primero obtenemos los datos del cliente para guardarlos en deleted_items
  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('name')
    .eq('id', id)
    .single();
  
  if (fetchError) {
    console.error('Error fetching client for deletion:', fetchError);
    throw new Error('No se pudo obtener los datos del cliente para eliminar');
  }
  
  // Actualizamos el campo deleted_at
  const { error: updateError } = await supabase
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) {
    console.error('Error deleting client:', updateError);
    throw new Error('No se pudo eliminar el cliente');
  }
  
  // Guardamos en la tabla deleted_items
  const { error: insertError } = await supabase
    .from('deleted_items')
    .insert({
      type: 'client',
      id: id,
      content: client.name,
      deleted_at: new Date().toISOString()
    });
  
  if (insertError) {
    console.error('Error saving client to deleted_items:', insertError);
    // No lanzamos error para no interrumpir el flujo principal
  }
  
  console.log('Client deleted successfully');
};
