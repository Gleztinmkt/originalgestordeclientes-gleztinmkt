import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FilterPanel } from "./FilterPanel";
import { PublicationCard } from "./PublicationCard";
import { StatusLegend } from "./StatusLegend";
import { Client } from "@/components/types/client";

interface CalendarViewProps {
  clients: Client[];
}

export const CalendarView = ({ clients }: CalendarViewProps) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: planningData = [], refetch } = useQuery({
    queryKey: ['publication_planning', format(selectedMonth, 'yyyy-MM')],
    queryFn: async () => {
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('publication_planning')
        .select('*')
        .gte('month', startOfMonth.toISOString())
        .lte('month', endOfMonth.toISOString())
        .is('deleted_at', null);

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const initializePlanning = async () => {
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      
      // Get existing planning entries for this month
      const { data: existingEntries } = await supabase
        .from('publication_planning')
        .select('client_id')
        .eq('month', startOfMonth.toISOString());

      const existingClientIds = new Set(existingEntries?.map(entry => entry.client_id));

      // Create entries for clients that don't have one yet
      const newEntries = clients
        .filter(client => !existingClientIds.has(client.id))
        .map(client => ({
          client_id: client.id,
          month: startOfMonth.toISOString(),
          status: 'consultar'
        }));

      if (newEntries.length > 0) {
        const { error } = await supabase
          .from('publication_planning')
          .insert(newEntries);

        if (error) console.error('Error initializing planning:', error);
        else await refetch();
      }
    };

    initializePlanning();
  }, [selectedMonth, clients]);

  const handleMonthChange = (date: Date) => {
    setSelectedMonth(date);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[250px,1fr,250px] gap-6">
      <div className="space-y-6">
        <FilterPanel onMonthChange={handleMonthChange} />
        <StatusLegend />
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">
          Planificación - {format(selectedMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {planningData.map((planning) => {
            const client = clients.find(c => c.id === planning.client_id);
            if (!client) return null;

            return (
              <PublicationCard
                key={planning.id}
                clientName={client.name}
                status={planning.status}
                planningId={planning.id}
                onStatusChange={refetch}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};