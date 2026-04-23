import { useState, useEffect, useMemo } from 'react';
import { Client } from "@/components/types/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MonthSelector } from "./MonthSelector";
import { StatusLegend } from "./StatusLegend";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, CheckSquare, Square, Search, ArrowUpDown, Plus, Users, Activity } from "lucide-react";
import { PlannerDialog } from "./PlannerDialog";
import { PRODUCTION_STATES, type ProductionStatus } from "./StatusLegend";

const getProductionColor = (status: ProductionStatus) => {
  return PRODUCTION_STATES.find(s => s.key === status)?.color || 'bg-gray-400';
};
const getProductionLabel = (status: ProductionStatus) => {
  return PRODUCTION_STATES.find(s => s.key === status)?.label || 'Sin hacer';
};
const getStatusLabel = (status: 'hacer' | 'no_hacer' | 'consultar') => {
  return status === 'hacer' ? 'Hacer' : status === 'no_hacer' ? 'No hacer' : 'Consultar';
};

interface PlanningCalendarProps {
  clients: Client[];
}

interface PlanningEntry {
  id: string;
  client_id: string;
  month: string;
  status: 'hacer' | 'no_hacer' | 'consultar';
  description?: string;
  completed?: boolean;
  planner?: string | null;
  production_status?: ProductionStatus;
}

export const PlanningCalendar = ({
  clients
}: PlanningCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [planningData, setPlanningData] = useState<Record<string, PlanningEntry>>({});
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Filter & sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productionFilter, setProductionFilter] = useState<string>("all");
  const [completionFilter, setCompletionFilter] = useState<string>("all");
  const [plannerFilter, setPlannerFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name_asc");
  const [showPlannerDialog, setShowPlannerDialog] = useState(false);

  const { data: planners = [], refetch: refetchPlanners } = useQuery({
    queryKey: ['planners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planners')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filteredClients = useMemo(() => {
    let filtered = clients.filter(client => {
      if (searchQuery && !client.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      const entry = planningData[client.id];
      if (statusFilter !== "all") {
        const status = entry?.status || 'consultar';
        if (status !== statusFilter) return false;
      }
      if (completionFilter === "done" && !entry?.completed) return false;
      if (completionFilter === "pending" && entry?.completed) return false;
      if (plannerFilter !== "all") {
        const assignedPlanner = entry?.planner || null;
        if (plannerFilter === "unassigned") {
          if (assignedPlanner) return false;
        } else {
          if (assignedPlanner !== plannerFilter) return false;
        }
      }
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'date_asc': {
          const aDate = planningData[a.id]?.month || '';
          const bDate = planningData[b.id]?.month || '';
          return aDate.localeCompare(bDate) || a.name.localeCompare(b.name);
        }
        case 'date_desc': {
          const aDate = planningData[a.id]?.month || '';
          const bDate = planningData[b.id]?.month || '';
          return bDate.localeCompare(aDate) || a.name.localeCompare(b.name);
        }
        default: return 0;
      }
    });

    return filtered;
  }, [clients, planningData, searchQuery, statusFilter, completionFilter, plannerFilter, sortBy]);

  const fetchPlanningData = async () => {
    try {
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const {
        data,
        error
      } = await supabase.from('publication_planning').select('*').is('deleted_at', null).eq('month', startOfMonth.toISOString());
      if (error) {
        console.error('Error fetching planning data:', error);
        toast({
          title: "Error al cargar los datos",
          description: "No se pudieron cargar los datos de planificación",
          variant: "destructive"
        });
        return;
      }
      const planningMap: Record<string, PlanningEntry> = {};
      data?.forEach(entry => {
        planningMap[entry.client_id] = {
          id: entry.id,
          client_id: entry.client_id,
          month: entry.month,
          status: (entry.status || 'consultar') as 'hacer' | 'no_hacer' | 'consultar',
          description: entry.description,
          completed: entry.completed,
          planner: (entry as any).planner || null
        };
      });
      setPlanningData(planningMap);
    } catch (error) {
      console.error('Error in fetchPlanningData:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los datos",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchPlanningData();
  }, [selectedDate]);

  const getStatusColor = (status: 'hacer' | 'no_hacer' | 'consultar') => {
    switch (status) {
      case 'hacer':
        return 'bg-green-500';
      case 'no_hacer':
        return 'bg-red-500';
      case 'consultar':
      default:
        return 'bg-yellow-500';
    }
  };

  const handleStatusChange = async (clientId: string, newStatus: 'hacer' | 'no_hacer' | 'consultar') => {
    if (isSaving) return;
    setIsSaving(true);
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const currentEntry = planningData[clientId];
    try {
      const {
        data: existingData,
        error: checkError
      } = await supabase.from('publication_planning').select('id').eq('client_id', clientId).eq('month', startOfMonth.toISOString()).is('deleted_at', null).maybeSingle();
      if (checkError) throw checkError;
      let result;
      if (existingData) {
        result = await supabase.from('publication_planning').update({
          status: newStatus,
          description: currentEntry?.description || ''
        }).eq('id', existingData.id).select().single();
      } else {
        result = await supabase.from('publication_planning').insert({
          client_id: clientId,
          month: startOfMonth.toISOString(),
          status: newStatus,
          description: currentEntry?.description || ''
        }).select().single();
      }
      if (result.error) throw result.error;

      setPlanningData(prev => ({
        ...prev,
        [clientId]: {
          ...result.data,
          id: result.data.id,
          client_id: clientId,
          month: startOfMonth.toISOString(),
          status: newStatus
        }
      }));
      toast({
        title: "Estado actualizado",
        description: "El estado se ha actualizado correctamente"
      });
    } catch (error) {
      console.error('Error updating planning status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompletion = async (clientId: string, completed: boolean) => {
    if (isSaving) return;
    setIsSaving(true);
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const currentEntry = planningData[clientId];
    try {
      const {
        data: existingData,
        error: checkError
      } = await supabase.from('publication_planning').select('id').eq('client_id', clientId).eq('month', startOfMonth.toISOString()).is('deleted_at', null).maybeSingle();
      if (checkError) throw checkError;
      let result;
      if (existingData) {
        result = await supabase.from('publication_planning').update({
          completed,
          status: currentEntry?.status || 'consultar',
          description: currentEntry?.description || ''
        }).eq('id', existingData.id).select().single();
      } else {
        result = await supabase.from('publication_planning').insert({
          client_id: clientId,
          month: startOfMonth.toISOString(),
          status: currentEntry?.status || 'consultar',
          description: currentEntry?.description || '',
          completed
        }).select().single();
      }
      if (result.error) throw result.error;

      setPlanningData(prev => ({
        ...prev,
        [clientId]: {
          ...result.data,
          id: result.data.id,
          client_id: clientId,
          month: startOfMonth.toISOString(),
          completed: result.data.completed
        }
      }));
      toast({
        title: completed ? "Tarea marcada como completada" : "Tarea marcada como pendiente",
        description: "El estado se ha actualizado correctamente"
      });
    } catch (error) {
      console.error('Error updating completion status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDescriptionSave = async () => {
    if (!selectedClient || isSaving) return;
    setIsSaving(true);
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    try {
      const {
        data: existingData,
        error: checkError
      } = await supabase.from('publication_planning').select('id').eq('client_id', selectedClient).eq('month', startOfMonth.toISOString()).is('deleted_at', null).maybeSingle();
      if (checkError) throw checkError;
      let result;
      if (existingData) {
        result = await supabase.from('publication_planning').update({
          description,
          status: planningData[selectedClient]?.status || 'consultar'
        }).eq('id', existingData.id).select().single();
      } else {
        result = await supabase.from('publication_planning').insert({
          client_id: selectedClient,
          month: startOfMonth.toISOString(),
          status: planningData[selectedClient]?.status || 'consultar',
          description
        }).select().single();
      }
      if (result.error) throw result.error;

      setPlanningData(prev => ({
        ...prev,
        [selectedClient]: {
          ...result.data,
          id: result.data.id,
          client_id: selectedClient,
          month: startOfMonth.toISOString()
        }
      }));
      toast({
        title: "Descripción guardada",
        description: "La descripción se ha guardado correctamente"
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving description:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la descripción",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlannerChange = async (clientId: string, plannerName: string | null) => {
    if (isSaving) return;
    setIsSaving(true);
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const currentEntry = planningData[clientId];
    try {
      const { data: existingData, error: checkError } = await supabase
        .from('publication_planning').select('id')
        .eq('client_id', clientId).eq('month', startOfMonth.toISOString())
        .is('deleted_at', null).maybeSingle();
      if (checkError) throw checkError;
      let result;
      if (existingData) {
        result = await supabase.from('publication_planning')
          .update({ planner: plannerName } as any)
          .eq('id', existingData.id).select().single();
      } else {
        result = await supabase.from('publication_planning')
          .insert({ client_id: clientId, month: startOfMonth.toISOString(), status: currentEntry?.status || 'consultar', planner: plannerName } as any)
          .select().single();
      }
      if (result.error) throw result.error;
      setPlanningData(prev => ({
        ...prev,
        [clientId]: { ...prev[clientId], ...result.data, client_id: clientId, month: startOfMonth.toISOString(), planner: plannerName }
      }));
      toast({ title: "Planificador asignado", description: `Se asignó ${plannerName || 'ninguno'} correctamente` });
    } catch (error) {
      console.error('Error updating planner:', error);
      toast({ title: "Error", description: "No se pudo asignar el planificador", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return <div className="space-y-6 p-6 bg-background min-h-screen px-0">
      <div className="flex items-center justify-between gap-4">
        <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
        <Button variant="outline" className="gap-2" onClick={() => setShowPlannerDialog(true)}>
          <Users className="h-4 w-4" />
          Planificadores
        </Button>
      </div>
      <StatusLegend getStatusColor={getStatusColor} />

      {/* Filter & Sort Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-card p-4 rounded-lg shadow-sm border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Estado</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="hacer">Hacer</SelectItem>
              <SelectItem value="no_hacer">No hacer</SelectItem>
              <SelectItem value="consultar">Consultar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Progreso</span>
          <Select value={completionFilter} onValueChange={setCompletionFilter}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Progreso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="done">Hechos</SelectItem>
              <SelectItem value="pending">Faltan hacer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Planificador</span>
          <Select value={plannerFilter} onValueChange={setPlannerFilter}>
            <SelectTrigger className="w-full md:w-[170px]">
              <SelectValue placeholder="Planificador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="unassigned">Sin asignar</SelectItem>
              {planners.map(p => (
                <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Ordenar</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <SelectValue placeholder="Ordenar" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_asc">Nombre A-Z</SelectItem>
              <SelectItem value="name_desc">Nombre Z-A</SelectItem>
              <SelectItem value="date_asc">Fecha más antigua</SelectItem>
              <SelectItem value="date_desc">Fecha más reciente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {filteredClients.map(client => {
        const planningEntry = planningData[client.id];
        const paymentDay = client.paymentDay || 1;
        const currentMonth = selectedDate.getMonth();
        const currentYear = selectedDate.getFullYear();
        const creationDate = new Date(currentYear, currentMonth, Math.max(1, paymentDay - 7));
        return <Card key={client.id} 
                onContextMenu={e => {
                  e.preventDefault();
                  const status = planningData[client.id]?.status || 'consultar';
                  const nextStatus = status === 'hacer' ? 'no_hacer' : status === 'no_hacer' ? 'consultar' : 'hacer';
                  handleStatusChange(client.id, nextStatus);
                }} 
                className="hover:shadow-md transition-shadow duration-200 relative md:p-3 p-2 w-[calc(100vw-3rem)] md:w-auto mx-auto md:mx-0">
              <div className="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className={`w-3 h-3 rounded-full cursor-pointer ${getStatusColor(planningEntry?.status || 'consultar')}`} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'hacer')}>
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                      Hacer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'no_hacer')}>
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                      No hacer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'consultar')}>
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                      Consultar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm truncate pr-6">{client.name}</h3>
                  <Button variant="ghost" size="icon" className="flex-shrink-0 -mt-1" onClick={() => handleCompletion(client.id, !planningEntry?.completed)}>
                    {planningEntry?.completed ? <CheckSquare className="h-5 w-5 text-green-500" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3" />
                  <span>Creación: {format(creationDate, 'd MMM', { locale: es })}</span>
                </div>
                <Select
                  value={planningEntry?.planner || "sin_asignar"}
                  onValueChange={(value) => handlePlannerChange(client.id, value === "sin_asignar" ? null : value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      <SelectValue placeholder="Planificador" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                    {planners.map(p => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="ghost" className="w-full text-left justify-start h-auto py-1 px-2 mt-2 text-xs" onClick={() => {
            setSelectedClient(client.id);
            setDescription(planningData[client.id]?.description || '');
            setIsEditing(false);
            setIsDialogOpen(true);
          }}>
                {planningData[client.id]?.description ? <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {planningData[client.id].description}
                  </p> : <p className="text-xs text-gray-400 dark:text-gray-600">
                    Agregar descripción...
                  </p>}
              </Button>
            </Card>;
      })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl min-h-[600px] h-auto">
          <DialogHeader>
            <DialogTitle>Descripción de planificación</DialogTitle>
          </DialogHeader>
          <Textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Ingrese la descripción..." 
            className="min-h-[400px] text-base leading-relaxed"
            readOnly={!isEditing}
          />
          <div className="flex justify-between gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(!isEditing)}
              className={isEditing ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
            >
              {isEditing ? "Vista previa" : "Editar"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleDescriptionSave} disabled={isSaving || !isEditing}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PlannerDialog 
        open={showPlannerDialog} 
        onOpenChange={setShowPlannerDialog} 
        onPlannerUpdated={() => refetchPlanners()} 
      />
    </div>;
};
