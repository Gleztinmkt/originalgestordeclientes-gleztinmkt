
import { Publication } from "../../client/publication/types";
import { Client } from "../../types/client";

export interface PublicationDialogProps {
  publication: Publication;
  client?: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onDelete?: () => void;
  designers?: any[];
}

export interface PublicationFormData {
  name: string;
  type: 'reel' | 'carousel' | 'image';
  description: string;
  copywriting: string;
  designer: string;
  status: string;
  date: Date;
  links: Array<{
    label: string;
    url: string;
  }>;
}
