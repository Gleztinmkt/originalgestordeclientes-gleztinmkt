import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
import { PublicationCard } from "./PublicationCard";
import { FilterPanel } from "./FilterPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export const CalendarView = ({ clients }: { clients: Client[] }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const { data: publications = [], refetch } = useQuery({
    queryKey: ['publications', selectedClient],
    queryFn: async () => {
      let query = supabase
        .from('publications')
        .select('*')
        .is('deleted_at', null)
        .order('date', { ascending: true });

      if (selectedClient) {
        query = query.eq('client_id', selectedClient);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching publications:', error);
        return [];
      }
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

      if (error) {
        console.error('Error fetching designers:', error);
        return [];
      }
      return data;
    },
  });

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const publication = publications.find(p => p.id === result.draggableId);
    if (!publication) return;

    const newDate = new Date(publication.date);
    const daysDiff = result.destination.index - result.source.index;
    newDate.setDate(newDate.getDate() + daysDiff);

    try {
      const { error } = await supabase
        .from('publications')
        .update({ date: newDate.toISOString() })
        .eq('id', publication.id);

      if (error) throw error;

      toast({
        title: "Fecha actualizada",
        description: "La fecha de la publicación ha sido actualizada correctamente.",
      });

      refetch();
    } catch (error) {
      console.error('Error updating publication date:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la fecha de la publicación.",
        variant: "destructive",
      });
    }
  };

  const filteredPublications = publications.filter(pub => {
    if (selectedDate && format(new Date(pub.date), 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd')) return false;
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
    <div className="flex h-[calc(100vh-200px)]">
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

      <div className="flex-1 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="publications">
            {(provided) => (
              <ScrollArea 
                className="h-[calc(100vh-400px)] rounded-md border p-4"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <div className="space-y-4">
                  {filteredPublications.map((publication, index) => (
                    <Draggable 
                      key={publication.id} 
                      draggableId={publication.id} 
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <PublicationCard
                            publication={publication}
                            client={clients.find(c => c.id === publication.client_id)}
                            onUpdate={refetch}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </ScrollArea>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};