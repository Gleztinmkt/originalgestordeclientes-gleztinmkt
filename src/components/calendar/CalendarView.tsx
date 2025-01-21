import { useState, useEffect } from "react";
import { addDays, format, getDaysInMonth, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FilterPanel } from "./FilterPanel";
import { PublicationCard } from "./PublicationCard";
import { StatusLegend } from "./StatusLegend";
import { Client } from "../types/client";
import { Designer } from "./types";

interface CalendarViewProps {
  clients: Client[];
}

export const CalendarView = ({ clients }: CalendarViewProps) => {
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedDesigner, setSelectedDesigner] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch designers
  const { data: designers = [] } = useQuery({
    queryKey: ['designers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('designers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Designer[];
    }
  });

  // Fetch publications
  const { data: publications = [] } = useQuery({
    queryKey: ['publications', selectedClient, selectedDesigner, selectedStatus, selectedType, selectedPackage],
    queryFn: async () => {
      let query = supabase
        .from('publications')
        .select('*')
        .is('deleted_at', null);

      if (selectedClient) {
        query = query.eq('client_id', selectedClient);
      }
      if (selectedDesigner) {
        query = query.eq('designer', selectedDesigner);
      }
      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }
      if (selectedType) {
        query = query.eq('type', selectedType);
      }
      if (selectedPackage) {
        query = query.eq('package_id', selectedPackage);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => addDays(firstDayOfMonth, i));

  return (
    <div className="space-y-4 p-4">
      <FilterPanel
        clients={clients}
        designers={designers}
        selectedClient={selectedClient}
        selectedDesigner={selectedDesigner}
        selectedStatus={selectedStatus}
        selectedType={selectedType}
        selectedPackage={selectedPackage}
        onClientChange={setSelectedClient}
        onDesignerChange={setSelectedDesigner}
        onStatusChange={setSelectedStatus}
        onTypeChange={setSelectedType}
        onPackageChange={setSelectedPackage}
        onDesignerAdded={() => {}}
      />

      <StatusLegend />

      <div className="grid grid-cols-7 gap-4">
        {days.map((day) => (
          <div key={day.toString()} className="p-2 border rounded-lg">
            <div className="text-sm font-medium mb-2">
              {format(day, "d 'de' MMMM", { locale: es })}
            </div>
            <div className="space-y-2">
              {publications
                .filter((pub) => format(new Date(pub.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
                .map((publication) => (
                  <PublicationCard
                    key={publication.id}
                    publication={publication}
                    client={clients.find(c => c.id === publication.client_id)}
                    designer={designers.find(d => d.name === publication.designer)}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};