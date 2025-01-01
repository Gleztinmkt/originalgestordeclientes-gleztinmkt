import { Client } from "@/components/ClientList";
import { Task } from "@/components/TaskList";
import { Json } from "@/integrations/supabase/types";

export interface ClientPackage {
  id: string;
  name: string;
  totalPublications: number;
  usedPublications: number;
  month: string;
  paid: boolean;
}

export interface DatabaseClient {
  id: string;
  name: string;
  phone: string | null;
  payment_day: number | null;
  marketing_info: string | null;
  instagram: string | null;
  facebook: string | null;
  packages: Json;
  created_at?: string;
}

export interface DatabaseTask {
  id: string;
  content: string;
  type: string | null;
  date: string | null;
  client_id: string | null;
  created_at?: string;
}

export const convertDatabaseClient = (client: DatabaseClient): Client => ({
  id: client.id,
  name: client.name,
  phone: client.phone || "",
  paymentDay: client.payment_day || 1,
  marketingInfo: client.marketing_info || "",
  instagram: client.instagram || "",
  facebook: client.facebook || "",
  packages: (client.packages as any[] || []).map(pkg => ({
    id: pkg.id || crypto.randomUUID(),
    name: pkg.name || "",
    totalPublications: pkg.totalPublications || 0,
    usedPublications: pkg.usedPublications || 0,
    month: pkg.month || "",
    paid: pkg.paid || false
  })),
});

export const convertClientForDatabase = (client: Client): DatabaseClient => ({
  id: client.id,
  name: client.name,
  phone: client.phone || null,
  payment_day: client.paymentDay || null,
  marketing_info: client.marketingInfo || null,
  instagram: client.instagram || null,
  facebook: client.facebook || null,
  packages: client.packages as Json,
});

export const convertDatabaseTask = (task: DatabaseTask): Task => ({
  id: task.id,
  content: task.content,
  type: task.type as Task['type'],
  date: task.date || undefined,
  clientId: task.client_id,
});

export const convertTaskForDatabase = (task: Task): DatabaseTask => ({
  id: task.id,
  content: task.content,
  type: task.type || null,
  date: task.date?.toISOString() || null,
  client_id: task.clientId || null,
});