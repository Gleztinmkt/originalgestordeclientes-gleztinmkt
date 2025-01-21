export interface Task {
  id: string;
  content: string;
  type: "campaña" | "publicaciones" | "correcciones" | "calendarios" | "cobros" | "otros";
  date: string | null;
  clientId: string | null;
  completed: boolean;
  executionDate?: Date;
  reminderDate?: Date;
  reminderFrequency?: string;
}