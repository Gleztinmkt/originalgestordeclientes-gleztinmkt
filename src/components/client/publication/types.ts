export interface Publication {
  id: string;
  client_id: string;
  name: string;
  type: 'reel' | 'carousel' | 'image';
  date: string;
  description?: string | null;
  package_id?: string | null;
  is_published?: boolean;
  google_calendar_event_id?: string | null;
  google_calendar_id?: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export interface PublicationFormValues {
  name: string;
  type: 'reel' | 'carousel' | 'image';
  date: Date;
  description?: string;
}

export interface PublicationCalendarDialogProps {
  clientId: string;
  clientName: string;
  packageId?: string;
}