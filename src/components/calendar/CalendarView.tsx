import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
import { PublicationCard } from "./PublicationCard";
import { FilterPanel } from "./FilterPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "../ui/button";
import { 
  Video, 
  Edit, 
  CheckCircle2, 
  Upload, 
  AlertCircle,
  Clock,
  Plus,
  Calendar as CalendarIcon
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Badge } from "../ui/badge";

export const CalendarView = ({ clients }: { clients: Client[] }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [view, setView] = useState<"month" | "week">("month");

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

  const getStatusColor = (publication: Publication) => {
    if (publication.is_published) return "bg-green-100";
    if (publication.approved) return "bg-blue-100";
    if (publication.in_review) return "bg-yellow-100";
    if (publication.in_editing) return "bg-purple-100";
    if (publication.needs_editing) return "bg-orange-100";
    if (publication.needs_recording) return "bg-red-100";
    return "bg-gray-100";
  };

  const getStatusIcon = (publication: Publication) => {
    if (publication.is_published) return <Upload className="h-4 w-4 text-green-600" />;
    if (publication.approved) return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    if (publication.in_review) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    if (publication.in_editing) return <Edit className="h-4 w-4 text-purple-600" />;
    if (publication.needs_editing) return <Edit className="h-4 w-4 text-orange-600" />;
    if (publication.needs_recording) return <Video className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const filteredPublications = publications.filter(pub => {
    if (selectedDate && format(new Date(pub.date), 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd')) return false;
    if (selectedDesigner && pub.designer !== selectedDesigner) return false;
    if (selectedStatus) {
      switch (selectedStatus) {
        case 'needs_recording': return pub.needs_recording;
        case 'needs_editing': return pub.needs_editing;
        case 'in_editing': return pub.in_editing;
        case 'in_review': return pub.in_review;
        case 'approved': return pub.approved;
        case 'published': return pub.is_published;
        default: return true;
      }
    }
    return true;
  });

  return (
    <div className="flex h-screen">
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Hoy
            </Button>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(d => d ? addDays(d, -1) : new Date())}
              >
                &lt;
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(d => d ? addDays(d, 1) : new Date())}
              >
                &gt;
              </Button>
            </div>
            <h2 className="text-xl font-semibold">
              {selectedDate ? format(selectedDate, 'MMMM yyyy') : ''}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={view === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("month")}
            >
              Mes
            </Button>
            <Button
              variant={view === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("week")}
            >
              Semana
            </Button>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="publications">
            {(provided) => (
              <div 
                className="grid grid-cols-7 gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {/* Calendar header */}
                {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map((day) => (
                  <div key={day} className="p-2 text-center font-semibold text-sm">
                    {day}
                  </div>
                ))}

                {/* Calendar grid */}
                {Array.from({ length: 35 }).map((_, index) => {
                  const date = new Date(selectedDate || new Date());
                  date.setDate(date.getDate() - date.getDay() + index);
                  const dayPublications = filteredPublications.filter(
                    pub => format(new Date(pub.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                  );

                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] border p-1 ${
                        format(date, 'MM') !== format(selectedDate || new Date(), 'MM')
                          ? 'bg-gray-50'
                          : 'bg-white'
                      }`}
                    >
                      <div className="text-right text-sm mb-1">
                        {format(date, 'd')}
                      </div>
                      <ScrollArea className="h-full">
                        {dayPublications.map((publication, pubIndex) => (
                          <Draggable
                            key={publication.id}
                            draggableId={publication.id}
                            index={pubIndex}
                          >
                            {(provided) => (
                              <ContextMenu>
                                <ContextMenuTrigger>
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`mb-1 p-1 rounded text-sm ${getStatusColor(publication)}`}
                                  >
                                    <div className="flex items-center gap-1">
                                      {getStatusIcon(publication)}
                                      <span className="truncate">
                                        {clients.find(c => c.id === publication.client_id)?.name} - {publication.name}
                                      </span>
                                    </div>
                                  </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem>Editar publicación</ContextMenuItem>
                                  <ContextMenuItem>Asignar diseñador</ContextMenuItem>
                                  <ContextMenuItem>Marcar como grabado</ContextMenuItem>
                                  <ContextMenuItem>Marcar como editado</ContextMenuItem>
                                  <ContextMenuItem>Marcar como aprobado</ContextMenuItem>
                                  <ContextMenuItem>Marcar como publicado</ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            )}
                          </Draggable>
                        ))}
                      </ScrollArea>
                    </div>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};