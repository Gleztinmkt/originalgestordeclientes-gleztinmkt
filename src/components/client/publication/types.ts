export interface Publication {
  id: string;
  client_id: string | null;
  name: string;
  type: 'reel' | 'carousel' | 'image';
  date: string;
  description?: string | null;
  package_id?: string | null;
  is_published?: boolean;
  google_calendar_event_id?: string | null;
  google_calendar_id?: string | null;
  status?: string;
  designer?: string | null;
  needs_recording?: boolean;
  needs_editing?: boolean;
  in_editing?: boolean;
  in_review?: boolean;
  approved?: boolean;
  in_cloud?: boolean;
  reference_materials?: any[];
  filming_time?: string | null;
  links?: string | null;
  copywriting?: string | null;
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