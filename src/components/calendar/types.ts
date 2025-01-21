import { Client } from "../types/client";
import { Publication } from "../client/publication/types";

export interface CalendarViewProps {
  clients: Client[];
  publications: Publication[];
  isLoading?: boolean;
}