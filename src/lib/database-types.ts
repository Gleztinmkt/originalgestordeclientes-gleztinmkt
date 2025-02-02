import { Client } from "@/components/types/client";
import { Task } from "@/components/TaskList";
import { Json } from "@/integrations/supabase/types";

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
  type: "campaña" | "publicaciones" | "correcciones" | "otros" | "calendarios" | "cobros" | "pagina web" | null;
  date: string | null;
  client_id: string | null;
  created_at?: string;
  completed?: boolean;
  execution_date?: string | null;
  reminder_date?: string | null;
  reminder_frequency?: string | null;
  deleted_at?: string | null;
  description?: string | null;
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
    paid: pkg.paid || false,
    isSplitPayment: pkg.isSplitPayment || false,
    firstHalfPaid: pkg.firstHalfPaid || false,
    secondHalfPaid: pkg.secondHalfPaid || false
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
  type: task.type || "otros",
  date: task.date || null,
  clientId: task.client_id,
  completed: task.completed || false,
  executionDate: task.execution_date ? new Date(task.execution_date) : undefined,
  reminderDate: task.reminder_date ? new Date(task.reminder_date) : undefined,
  reminderFrequency: task.reminder_frequency,
  description: task.description || undefined,
});

export const convertTaskForDatabase = (task: Task): DatabaseTask => ({
  id: task.id,
  content: task.content,
  type: task.type,
  date: task.date || null,
  client_id: task.clientId || null,
  completed: task.completed || false,
  execution_date: task.executionDate?.toISOString() || null,
  reminder_date: task.reminderDate?.toISOString() || null,
  reminder_frequency: task.reminderFrequency || null,
  description: task.description || null,
});