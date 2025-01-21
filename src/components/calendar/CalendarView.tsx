import { useState, useEffect } from "react";
import { format, getDaysInMonth, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { FilterPanel } from "./FilterPanel";
import { PublicationCard } from "./PublicationCard";
import { PublicationDialog } from "./PublicationDialog";
import { StatusLegend } from "./StatusLegend";
import { CalendarViewProps } from "./types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const CalendarView = ({ clients = [], publications = [], isLoading }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedDesigner, setSelectedDesigner] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [selectedPublication, setSelectedPublication] = useState(null);

  const { data: designers = [] } = useQuery({
    queryKey: ['designers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('designers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const daysInCurrentMonth = getDaysInMonth(selectedDate);
  const firstDayOfMonth = startOfMonth(selectedDate);

  const filteredPublications = publications.filter(publication => {
    const publicationDate = new Date(publication.date);
    return (
      publicationDate.getMonth() === selectedDate.getMonth() &&
      publicationDate.getFullYear() === selectedDate.getFullYear() &&
      (selectedClient ? publication.client_id === selectedClient : true) &&
      (selectedDesigner ? publication.designer === selectedDesigner : true) &&
      (selectedStatus ? publication.status === selectedStatus : true) &&
      (selectedType ? publication.type === selectedType : true) &&
      (selectedPackage ? publication.package_id === selectedPackage : true)
    );
  });

  return (
    <div className="space-y-4 p-4">
      <FilterPanel
        clients={clients}
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
        designers={designers}
      />
      
      <div className="grid grid-cols-7 gap-4">
        {Array.from({ length: daysInCurrentMonth }, (_, index) => {
          const day = index + 1;
          const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
          return (
            <div key={day} className="border p-2">
              <h3 className="font-bold">{format(date, 'EEEE', { locale: es })}</h3>
              <p>{day}</p>
              {filteredPublications
                .filter(publication => new Date(publication.date).getDate() === day)
                .map(publication => (
                  <PublicationCard
                    key={publication.id}
                    publication={publication}
                    onSelect={setSelectedPublication}
                  />
                ))}
            </div>
          );
        })}
      </div>

      {selectedPublication && (
        <PublicationDialog
          publication={selectedPublication}
          onClose={() => setSelectedPublication(null)}
        />
      )}

      <StatusLegend />
    </div>
  );
};
