export type PublicationType = "reel" | "carousel" | "image";

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
  packageId?: string;
}

export interface PublicationFormProps {
  clientId: string;
  packageId?: string;
  onSubmit?: (values: Omit<Publication, 'id'>) => void;
  isSubmitting?: boolean;
}

export interface PublicationListProps {
  clientId: string;
  packageId?: string;
  onSelect: (publication: Publication) => void;
  onTogglePublished: (id: string, isPublished: boolean) => Promise<void>;
}