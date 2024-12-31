import { Client } from "@/components/ClientList";
import { Task } from "@/components/TaskList";

export interface DatabaseClient {
  id: string;
  name: string;
  phone: string;
  paymentDay: number;
  marketingInfo: string;
  instagram?: string;
  facebook?: string;
  packages: string; // JSON string in database
}

export interface DatabaseTask {
  id: string;
  content: string;
  type: "reminder" | "call" | "meeting" | "task";
  date?: string;
  clientId?: string | null;
}

export const convertDatabaseClient = (client: DatabaseClient): Client => ({
  ...client,
  packages: JSON.parse(client.packages || '[]'),
});

export const convertClientForDatabase = (client: Client): DatabaseClient => ({
  ...client,
  packages: JSON.stringify(client.packages),
});