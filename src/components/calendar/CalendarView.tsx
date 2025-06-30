
import { useState, useEffect, useMemo, useCallback, memo } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CalendarViewProps {
  clients: Client[];
}

const CalendarViewComponent = ({ clients }: CalendarViewProps) => {
  const initialDate = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<{
    [key: string]: boolean;
  }>({});
  const [highlightedPublicationId, setHighlightedPublicationId] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const isMobile = useIsMobile();

  // Optimized user role query with error handling
  const {
    data: userRole
  } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      try {
        const {
          data: {
            user
          }, error: userError
        } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.warn('No authenticated user or error:', userError);
          return null;
        }
        
        const {
          data: roleData, error: roleError
        } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
        
        if (roleError) {
          console.error('Error fetching user role:', roleError);
          return null;
        }
        
        return roleData?.role || null;
      } catch (error) {
        console.error('Error in user role query:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      console.warn(`User role query failed ${failureCount} times:`, error);
      return failureCount < 2;
    }
  });

  // Optimized publications query with defensive programming
  const {
    data: publications = [],
    refetch,
    isLoading: publicationsLoading,
    isError: publicationsError
  } = useQuery({
    queryKey: ['publications', selectedClient],
    queryFn: async () => {
      try {
        let query = supabase.from('publications')
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
        
        // Defensive validation of publication data
        if (!Array.isArray(data)) {
          console.warn('Publications data is not an array:', data);
          return [];
        }
        
        const validPublications = data.filter(pub => {
          if (!pub || typeof pub !== 'object') {
            console.warn('Invalid publication object:', pub);
            return false;
          }
          
          if (!pub.id || !pub.name || !pub.date || !pub.type) {
            console.warn('Publication missing required fields:', pub);
            return false;
          }
          
          // Validate date
          const date = new Date(pub.date);
          if (isNaN(date.getTime())) {
            console.warn('Invalid date in publication:', pub.id, pub.date);
            return false;
          }
          
          return true;
        });
        
        return validPublications as Publication[];
      } catch (error) {
        console.error('Error in publications query:', error);
        return [];
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      console.warn(`Publications query failed ${failureCount} times:`, error);
      return failureCount < 3;
    }
  });

  // Optimized designers query
  const {
    data: designers = [],
    refetch: refetchDesigners
  } = useQuery({
    queryKey: ['designers'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('designers')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) {
          console.error('Error fetching designers:', error);
          return [];
        }
        
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error in designers query:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  });

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || userRole !== 'admin') {
      if (userRole !== 'admin') {
        toast({
          title: "Acceso denegado",
          description: "Solo los administradores pueden modificar las fechas de las publicaciones.",
          variant: "destructive"
        });
      }
      return;
    }

    const destinationDate = result.destination.droppableId;
    const publicationId = result.draggableId;
    
    if (!destinationDate || !publicationId) {
      console.warn('Missing destination date or publication ID');
      return;
    }

    const publication = publications.find(p => p?.id === publicationId);
    if (!publication) {
      console.warn('Publication not found:', publicationId);
      return;
    }

    try {
      const adjustedDate = new Date(destinationDate);
      if (isNaN(adjustedDate.getTime())) {
        console.error('Invalid destination date:', destinationDate);
        return;
      }
      
      adjustedDate.setDate(adjustedDate.getDate() + 1);
      
      const { error } = await supabase.from('publications')
        .update({ date: adjustedDate.toISOString() })
        .eq('id', publicationId);

      if (error) throw error;

      setHighlightedPublicationId(publicationId);
      toast({
        title: "Fecha actualizada",
        description: "La fecha de la publicación ha sido actualizada correctamente."
      });
      
      refetch();
    } catch (error) {
      console.error('Error updating publication date:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la fecha de la publicación.",
        variant: "destructive"
      });
    }
  }, [userRole, publications, refetch]);

  useEffect(() => {
    if (highlightedPublicationId) {
      const timer = setTimeout(() => {
        setHighlightedPublicationId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedPublicationId]);

  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress > 100) {
        clearInterval(interval);
      } else {
        setLoadingProgress(progress);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Optimized filtered publications with error handling
  const filteredPublications = useMemo(() => {
    try {
      if (!Array.isArray(publications)) {
        console.warn('Publications is not an array in filter:', publications);
        return [];
      }

      return publications.filter(pub => {
        try {
          if (!pub || typeof pub !== 'object') return false;
          
          if (selectedType && pub.type !== selectedType) return false;
          if (selectedPackage && pub.package_id !== selectedPackage) return false;
          if (selectedDesigner && pub.designer !== selectedDesigner) return false;
          
          if (selectedStatus) {
            switch (selectedStatus) {
              case 'needs_recording':
                return Boolean(pub.needs_recording);
              case 'needs_editing':
                return Boolean(pub.needs_editing);
              case 'in_editing':
                return Boolean(pub.in_editing);
              case 'in_review':
                return Boolean(pub.in_review);
              case 'approved':
                return Boolean(pub.approved);
              case 'published':
                return Boolean(pub.is_published);
              default:
                return true;
            }
          }
          return true;
        } catch (error) {
          console.error('Error filtering publication:', error, pub);
          return false;
        }
      });
    } catch (error) {
      console.error('Error in filteredPublications:', error);
      return [];
    }
  }, [publications, selectedType, selectedPackage, selectedDesigner, selectedStatus]);

  // Optimized calendar calculations
  const daysInMonth = useMemo(() => {
    try {
      return eachDayOfInterval({
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate)
      });
    } catch (error) {
      console.error('Error calculating days in month:', error);
      return [];
    }
  }, [selectedDate]);

  const startDay = useMemo(() => {
    try {
      return startOfMonth(selectedDate).getDay();
    } catch (error) {
      console.error('Error calculating start day:', error);
      return 0;
    }
  }, [selectedDate]);
  
  const emptyDays = useMemo(() => Array(startDay).fill(null), [startDay]);
  const allDays = useMemo(() => [...emptyDays, ...daysInMonth], [emptyDays, daysInMonth]);

  const toggleDayExpansion = useCallback((date: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  }, []);

  // Optimized clients map
  const clientsMap = useMemo(() => {
    try {
      const map = new Map();
      if (Array.isArray(clients)) {
        clients.forEach(client => {
          if (client && client.id) {
            map.set(client.id, client);
          }
        });
      }
      return map;
    } catch (error) {
      console.error('Error creating clients map:', error);
      return new Map();
    }
  }, [clients]);

  const handleGoToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const handlePrevMonth = useCallback(() => {
    setSelectedDate(prev => addMonths(prev, -1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedDate(prev => addMonths(prev, 1));
  }, []);

  // Show loading state with progress
  if (publicationsLoading || (!publications.length && loadingProgress < 100)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8">
        <div className="w-full max-w-md space-y-2">
          <h2 className="text-lg font-medium text-center mb-4">
            Cargando publicaciones...
          </h2>
          <Progress value={loadingProgress} className="w-full" />
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {loadingProgress}%
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (publicationsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8">
        <Alert variant="destructive">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Error al cargar las publicaciones. Por favor, intenta recargar la página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const FilterContent = memo(() => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Filtros</h3>
      </div>
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
    </div>
  ));

  const CalendarContent = memo(() => (
    <DragDropContext onDragEnd={handleDragEnd}>
      {isMobile ? (
        <div className="calendar-mobile-view">
          {daysInMonth.map(date => {
            try {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayPublications = filteredPublications.filter(pub => {
                try {
                  return format(new Date(pub.date), 'yyyy-MM-dd') === dateStr;
                } catch (error) {
                  console.error('Error filtering publication by date:', error, pub);
                  return false;
                }
              });
              
              if (dayPublications.length === 0) return null;
              const isCurrentDay = isToday(date);
              
              return (
                <Droppable key={dateStr} droppableId={dateStr}>
                  {provided => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps} 
                      className={`calendar-day-card ${isCurrentDay ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
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
                          if (!publication || !publication.id) return null;
                          
                          return (
                            <Draggable key={publication.id} draggableId={publication.id} index={pubIndex}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef} 
                                  {...provided.draggableProps} 
                                  {...provided.dragHandleProps} 
                                  className={`draggable-item ${snapshot.isDragging ? 'dragging' : ''} ${highlightedPublicationId === publication.id ? 'animate-pulse bg-blue-100 dark:bg-blue-900' : ''}`}
                                >
                                  <PublicationCard 
                                    publication={publication} 
                                    client={clientsMap.get(publication.client_id)} 
                                    onUpdate={refetch} 
                                    displayTitle={`${clientsMap.get(publication.client_id)?.name || ''} - ${publication.type === 'reel' ? 'R' : publication.type === 'carousel' ? 'C' : 'I'} - ${publication.name}`} 
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
            } catch (error) {
              console.error('Error rendering mobile day:', error, date);
              return null;
            }
          })}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(day => (
            <div key={day} className="p-2 text-center font-semibold text-sm">
              {day}
            </div>
          ))}

          {allDays.map((date, index) => {
            if (!date) {
              return (
                <div 
                  key={`empty-${index}`} 
                  className="min-h-[120px] border rounded-lg p-1 relative bg-gray-50 dark:bg-gray-900/50" 
                />
              );
            }
            
            try {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayPublications = filteredPublications.filter(pub => {
                try {
                  return format(new Date(pub.date), 'yyyy-MM-dd') === dateStr;
                } catch (error) {
                  console.error('Error filtering publication by date:', error, pub);
                  return false;
                }
              });
              const isCurrentDay = isToday(date);
              
              return (
                <Droppable key={dateStr} droppableId={dateStr}>
                  {provided => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps} 
                      className={`min-h-[120px] border rounded-lg p-1 relative bg-white/50 dark:bg-gray-800/50 ${isCurrentDay ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                    >
                      <div className={`text-right text-sm mb-1 px-1 ${isCurrentDay ? 'font-bold text-blue-500 dark:text-blue-400' : ''}`}>
                        {format(date, 'd')}
                      </div>
                      <ScrollArea className={`h-full ${isMobile ? 'touch-pan-y' : ''}`}>
                        <div className="space-y-1">
                          {dayPublications.map((publication, pubIndex) => {
                            if (!publication || !publication.id) return null;
                            
                            return (
                              <Draggable key={publication.id} draggableId={publication.id} index={pubIndex}>
                                {(provided, snapshot) => (
                                  <div 
                                    ref={provided.innerRef} 
                                    {...provided.draggableProps} 
                                    {...provided.dragHandleProps} 
                                    className={`draggable-item ${snapshot.isDragging ? 'dragging' : ''} ${highlightedPublicationId === publication.id ? 'animate-pulse bg-blue-100 dark:bg-blue-900' : ''}`}
                                  >
                                    <PublicationCard 
                                      publication={publication} 
                                      client={clientsMap.get(publication.client_id)} 
                                      onUpdate={refetch} 
                                      displayTitle={`${clientsMap.get(publication.client_id)?.name || ''} - ${publication.type === 'reel' ? 'R' : publication.type === 'carousel' ? 'C' : 'I'} - ${publication.name}`} 
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
            } catch (error) {
              console.error('Error rendering desktop day:', error, date);
              return (
                <div 
                  key={`error-${index}`} 
                  className="min-h-[120px] border rounded-lg p-1 relative bg-red-50 dark:bg-red-900/20" 
                />
              );
            }
          })}
        </div>
      )}
    </DragDropContext>
  ));

  return (
    <div className="h-screen flex flex-col">
      {isMobile ? (
        <>
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleGoToToday}>
                Hoy
              </Button>
              <div className="flex items-center space-x-1">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                  &lt;
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  &gt;
                </Button>
              </div>
              <h2 className="text-xl font-semibold capitalize">
                {format(selectedDate, 'MMMM yyyy', { locale: es })}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 mr-1">
                {filteredPublications.length}
              </Badge>
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
                <Button variant="outline" size="sm" onClick={handleGoToToday}>
                  Hoy
                </Button>
                <div className="flex items-center space-x-1">
                  <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                    &lt;
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleNextMonth}>
                    &gt;
                  </Button>
                </div>
                <h2 className="text-xl font-semibold capitalize">
                  {format(selectedDate, 'MMMM yyyy', { locale: es })}
                </h2>
                <Badge variant="outline" className="bg-primary/10 ml-2">
                  {filteredPublications.length} publicaciones
                </Badge>
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

export const CalendarView = memo(CalendarViewComponent);
