import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
import { PublicationCard } from "./PublicationCard";
import { FilterPanel } from "./FilterPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Filter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const CalendarView = ({ clients }: { clients: Client[] }) => {
  const initialDate = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({});
  const [highlightedPublicationId, setHighlightedPublicationId] = useState<string | null>(null);
  const [draggedOverDate, setDraggedOverDate] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { data: userRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      return roleData?.role || null;
    },
  });

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

  const handleDragEnd = async (result: DropResult) => {
    if (userRole !== 'admin') {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden modificar las fechas de las publicaciones.",
        variant: "destructive",
      });
      return;
    }

    if (!result.destination) return;

    const destinationDate = result.destination.droppableId;
    const publicationId = result.draggableId;

    const publication = publications.find(p => p.id === publicationId);
    if (!publication) return;

    try {
      const adjustedDate = new Date(destinationDate);
      adjustedDate.setDate(adjustedDate.getDate() + 1);

      const { error } = await supabase
        .from('publications')
        .update({ 
          date: adjustedDate.toISOString()
        })
        .eq('id', publicationId);

      if (error) throw error;

      setHighlightedPublicationId(publicationId);
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

  const handleDragUpdate = (update: any) => {
    if (!update.destination) {
      setDraggedOverDate(null);
      return;
    }
    setDraggedOverDate(update.destination.droppableId);
  };

  useEffect(() => {
    if (highlightedPublicationId) {
      const timer = setTimeout(() => {
        setHighlightedPublicationId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedPublicationId]);

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

  const startDay = startOfMonth(selectedDate).getDay();
  const emptyDays = Array(startDay).fill(null);
  const allDays = [...emptyDays, ...daysInMonth];

  const toggleDayExpansion = (date: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const FilterContent = () => (
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
      isDesigner={userRole === 'designer'}
    />
  );

  const CalendarContent = () => (
    <DragDropContext 
      onDragEnd={handleDragEnd}
      onDragUpdate={handleDragUpdate}
    >
      {isMobile ? (
        <div className="calendar-mobile-view">
          {daysInMonth.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isDraggedOver = draggedOverDate === dateStr;
            const dayPublications = filteredPublications.filter(
              pub => format(new Date(pub.date), 'yyyy-MM-dd') === dateStr
            );

            if (dayPublications.length === 0) return null;

            const isCurrentDay = isToday(date);

            return (
              <Droppable key={dateStr} droppableId={dateStr}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`calendar-day-card ${isCurrentDay ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''} ${
                      isDraggedOver ? 'bg-blue-50 dark:bg-blue-900/50 transition-colors duration-200' : ''
                    }`}
                  >
                    <div className={`calendar-day-header ${isCurrentDay ? 'font-bold text-blue-500 dark:text-blue-400' : ''}`}>
                      <h3 className="calendar-day-title">
                        {format(date, 'EEEE d', { locale: es })}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {dayPublications.length} publicaciones
                      </span>
                    </div>
                    <div className="calendar-publications">
                      {dayPublications.map((publication, pubIndex) => {
                        const client = clients.find(c => c.id === publication.client_id);
                        const typeShorthand = publication.type === 'reel' ? 'R' : publication.type === 'carousel' ? 'C' : 'I';
                        const displayTitle = `${client?.name || ''} - ${typeShorthand} - ${publication.name}`;

                        return (
                          <Draggable
                            key={publication.id}
                            draggableId={publication.id}
                            index={pubIndex}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`draggable-item ${snapshot.isDragging ? 'dragging' : ''} ${
                                  highlightedPublicationId === publication.id ? 'animate-pulse bg-blue-100 dark:bg-blue-900' : ''
                                }`}
                              >
                                <PublicationCard
                                  publication={publication}
                                  client={client}
                                  onUpdate={refetch}
                                  displayTitle={displayTitle}
                                  designers={designers}
                                  isMobile={isMobile}
                                />
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map((day) => (
            <div key={day} className="p-2 text-center font-semibold text-sm">
              {day}
            </div>
          ))}

          {allDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="min-h-[120px] border rounded-lg p-1 relative bg-gray-50 dark:bg-gray-900/50" />;
            }

            const dateStr = format(date, 'yyyy-MM-dd');
            const isDraggedOver = draggedOverDate === dateStr;
            const dayPublications = filteredPublications.filter(
              pub => format(new Date(pub.date), 'yyyy-MM-dd') === dateStr
            );

            const isCurrentDay = isToday(date);

            return (
              <Droppable key={dateStr} droppableId={dateStr}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[120px] border rounded-lg p-1 relative transition-colors duration-200 ${
                      isDraggedOver ? 'bg-blue-50 dark:bg-blue-900/50' : 'bg-white/50 dark:bg-gray-800/50'
                    } ${isCurrentDay ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                  >
                    <div className={`text-right text-sm mb-1 px-1 ${
                      isCurrentDay ? 'font-bold text-blue-500 dark:text-blue-400' : ''
                    }`}>
                      {format(date, 'd')}
                    </div>
                    <ScrollArea className={`h-full ${isMobile ? 'touch-pan-y' : ''}`}>
                      <div className="space-y-1">
                        {dayPublications.map((publication, pubIndex) => {
                          const client = clients.find(c => c.id === publication.client_id);
                          const typeShorthand = publication.type === 'reel' ? 'R' : publication.type === 'carousel' ? 'C' : 'I';
                          const displayTitle = `${client?.name || ''} - ${typeShorthand} - ${publication.name}`;

                          return (
                            <Draggable
                              key={publication.id}
                              draggableId={publication.id}
                              index={pubIndex}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`draggable-item ${snapshot.isDragging ? 'dragging' : ''} ${
                                    highlightedPublicationId === publication.id ? 'animate-pulse bg-blue-100 dark:bg-blue-900' : ''
                                  }`}
                                >
                                  <PublicationCard
                                    publication={publication}
                                    client={client}
                                    onUpdate={refetch}
                                    displayTitle={displayTitle}
                                    designers={designers}
                                    isMobile={isMobile}
                                  />
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      )}
    </DragDropContext>
  );

  return (
    <div className="h-screen flex flex-col">
      {isMobile ? (
        <>
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(initialDate)}
              >
                Hoy
              </Button>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSelectedDate(addMonths(selectedDate, -1));
                  }}
                >
                  &lt;
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSelectedDate(addMonths(selectedDate, 1));
                  }}
                >
                  &gt;
                </Button>
              </div>
              <h2 className="text-xl font-semibold capitalize">
                {format(selectedDate, 'MMMM yyyy', { locale: es })}
              </h2>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[400px]">
                <FilterContent />
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex-1 overflow-auto">
            <CalendarContent />
          </div>
        </>
      ) : (
        <>
          <div className="p-4 border-b space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(initialDate)}
                >
                  Hoy
                </Button>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedDate(addMonths(selectedDate, -1));
                    }}
                  >
                    &lt;
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedDate(addMonths(selectedDate, 1));
                    }}
                  >
                    &gt;
                  </Button>
                </div>
                <h2 className="text-xl font-semibold capitalize">
                  {format(selectedDate, 'MMMM yyyy', { locale: es })}
                </h2>
              </div>
            </div>
            <FilterContent />
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <CalendarContent />
          </div>
        </>
      )}
    </div>
  );
};
