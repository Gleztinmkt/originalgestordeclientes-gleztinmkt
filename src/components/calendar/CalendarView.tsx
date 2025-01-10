import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
import { PublicationCard } from "./PublicationCard";
import { StatusLegend } from "./StatusLegend";
import { FilterPanel } from "./FilterPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface CalendarViewProps {
  clients: Client[];
}

export const CalendarView = ({ clients }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const { data: publications = [], refetch } = useQuery({
    queryKey: ['publications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .is('deleted_at', null)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as Publication[];
    },
  });

  const { data: designers = [] } = useQuery({
    queryKey: ['designers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('designers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const filteredPublications = publications.filter(pub => {
    if (selectedDate && format(new Date(pub.date), 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd')) return false;
    if (selectedClient && pub.client_id !== selectedClient) return false;
    if (selectedDesigner && pub.designer !== selectedDesigner) return false;
    if (selectedStatus) {
      switch (selectedStatus) {
        case 'needs_recording':
          return pub.needs_recording;
        case 'needs_editing':
          return pub.needs_editing;
        case 'in_editing':
          return pub.in_editing;
        case 'in_review':
          return pub.in_review;
        case 'approved':
          return pub.approved;
        case 'published':
          return pub.is_published;
        default:
          return true;
      }
    }
    return true;
  });

  return (
    <div className="flex gap-4">
      <FilterPanel
        clients={clients}
        designers={designers}
        selectedClient={selectedClient}
        selectedDesigner={selectedDesigner}
        selectedStatus={selectedStatus}
        onClientChange={setSelectedClient}
        onDesignerChange={setSelectedDesigner}
        onStatusChange={setSelectedStatus}
      />

      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <StatusLegend />
          </div>
        </div>

        <ScrollArea className="h-[600px] rounded-md border p-4">
          <div className="space-y-4">
            {filteredPublications.map((publication) => (
              <PublicationCard
                key={publication.id}
                publication={publication}
                client={clients.find(c => c.id === publication.client_id)}
                onUpdate={refetch}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};