export type PublicationType = "instagram" | "facebook" | "tiktok" | "other";

export interface Publication {
  id: string;
  client_id?: string;
  name: string;
  type: PublicationType;
  date: string;
  description?: string;
  google_calendar_event_id?: string;
  package_id?: string;
  is_published?: boolean;
}

export interface PublicationCalendarDialogProps {
  clientId: string;
  clientName: string;
}