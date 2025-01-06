export type PublicationType = "reel" | "carousel" | "image";

export interface Publication {
  id: string;
  client_id: string;
  name: string;
  type: PublicationType;
  date: string;
  description: string | null;
  google_calendar_event_id?: string | null;
  created_at?: string;
}