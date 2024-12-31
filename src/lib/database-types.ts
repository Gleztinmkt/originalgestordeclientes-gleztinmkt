import { Client } from "@/components/ClientList";
import { Task } from "@/components/TaskList";

export interface DatabaseClient extends Record<string, unknown> {
  id: string;
  name: string;
  phone: string;
  paymentDay: number;
  marketingInfo: string;
  instagram?: string;
  facebook?: string;
  packages: string; // JSON string in database
}

export interface DatabaseTask extends Record<string, unknown> {
  id: string;
  content: string;
  type: "reminder" | "call" | "meeting" | "task";
  date?: string;
  clientId?: string | null;
}

export const convertDatabaseClient = (client: Record<string, unknown>): Client => ({
  id: client.id as string,
  name: client.name as string,
  phone: client.phone as string,
  paymentDay: client.paymentDay as number,
  marketingInfo: client.marketingInfo as string,
  instagram: client.instagram as string | undefined,
  facebook: client.facebook as string | undefined,
  packages: JSON.parse((client.packages as string) || '[]'),
});

export const convertClientForDatabase = (client: Client): Record<string, unknown> => ({
  id: client.id,
  name: client.name,
  phone: client.phone,
  paymentDay: client.paymentDay,
  marketingInfo: client.marketingInfo,
  instagram: client.instagram,
  facebook: client.facebook,
  packages: JSON.stringify(client.packages),
});

export const convertDatabaseTask = (task: Record<string, unknown>): Task => ({
  id: task.id as string,
  content: task.content as string,
  type: task.type as Task['type'],
  date: task.date as string | undefined,
  clientId: task.clientId as string | null | undefined,
});

export const convertTaskForDatabase = (task: Task): Record<string, unknown> => ({
  id: task.id,
  content: task.content,
  type: task.type,
  date: task.date,
  clientId: task.clientId,
});