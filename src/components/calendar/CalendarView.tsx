import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
import { PublicationCard } from "./PublicationCard";
import { FilterPanel } from "./FilterPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
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

export const CalendarView = ({ clients }: { clients: Client[] }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const { data: designers = [], refetch: refetchDesigners } = useQuery({
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

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (result: any) => {
    setIsDragging(false);
    
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

  const handleStatusChange = async (publicationId: string, status: string) => {
    try {
      const updates: any = {
        needs_recording: false,
        needs_editing: false,
        in_editing: false,
        in_review: false,
        approved: false,
        is_published: false
      };

      switch (status) {
        case 'needs_recording':
          updates.needs_recording = true;
          break;
        case 'needs_editing':
          updates.needs_editing = true;
          break;
        case 'in_editing':
          updates.in_editing = true;
          break;
        case 'in_review':
          updates.in_review = true;
          break;
        case 'approved':
          updates.approved = true;
          break;
        case 'published':
          updates.is_published = true;
          break;
      }

      const { error } = await supabase
        .from('publications')
        .update(updates)
        .eq('id', publicationId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: "El estado de la publicación ha sido actualizado correctamente.",
      });

      refetch();
    } catch (error) {
      console.error('Error updating publication status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la publicación.",
        variant: "destructive",
      });
    }
  };

  const filteredPublications = publications.filter(pub => {
    if (selectedType && pub.type !== selectedType) return false;
    if (selectedPackage && pub.package_id !== selectedPackage) return false;
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

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate)
  });

  return (
    <div className="flex h-screen">
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
        onDesignerAdded={refetchDesigners}
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
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
              >
                &lt;
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
              >
                &gt;
              </Button>
            </div>
            <h2 className="text-xl font-semibold">
              {format(selectedDate, 'MMMM yyyy', { locale: es })}
            </h2>
          </div>
        </div>

        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-7 gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map((day) => (
              <div key={day} className="p-2 text-center font-semibold text-sm">
                {day}
              </div>
            ))}

            {daysInMonth.map((date, index) => {
              const dayPublications = filteredPublications.filter(
                pub => format(new Date(pub.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
              );

              return (
                <Droppable key={format(date, 'yyyy-MM-dd')} droppableId={format(date, 'yyyy-MM-dd')}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="min-h-[120px] border p-1"
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
                            isDragDisabled={isDragging}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <ContextMenu>
                                  <ContextMenuTrigger>
                                    <PublicationCard
                                      publication={publication}
                                      client={clients.find(c => c.id === publication.client_id)}
                                      onUpdate={refetch}
                                    />
                                  </ContextMenuTrigger>
                                  <ContextMenuContent>
                                    <ContextMenuItem onClick={() => handleStatusChange(publication.id, 'needs_recording')}>
                                      Marcar como "Falta grabar"
                                    </ContextMenuItem>
                                    <ContextMenuItem onClick={() => handleStatusChange(publication.id, 'needs_editing')}>
                                      Marcar como "Falta editar"
                                    </ContextMenuItem>
                                    <ContextMenuItem onClick={() => handleStatusChange(publication.id, 'in_editing')}>
                                      Marcar como "En edición"
                                    </ContextMenuItem>
                                    <ContextMenuItem onClick={() => handleStatusChange(publication.id, 'in_review')}>
                                      Marcar como "En revisión"
                                    </ContextMenuItem>
                                    <ContextMenuItem onClick={() => handleStatusChange(publication.id, 'approved')}>
                                      Marcar como "Aprobado"
                                    </ContextMenuItem>
                                    <ContextMenuItem onClick={() => handleStatusChange(publication.id, 'published')}>
                                      Marcar como "Publicado"
                                    </ContextMenuItem>
                                  </ContextMenuContent>
                                </ContextMenu>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ScrollArea>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};