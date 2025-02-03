import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Client } from "@/components/types/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface PlanningCalendarProps {
  clients: Client[];
}

interface PlanningEntry {
  id: string;
  client_id: string;
  month: string;
  status: 'hacer' | 'no_hacer' | 'consultar';
  description?: string;
}

export const PlanningCalendar = ({ clients }: PlanningCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [planningData, setPlanningData] = useState<Record<string, PlanningEntry>>({});
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchPlanningData = async () => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const { data, error } = await supabase
      .from('publication_planning')
      .select('*')
      .is('deleted_at', null)
      .gte('month', startOfMonth.toISOString())
      .lte('month', new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString());

    if (error) {
      console.error('Error fetching planning data:', error);
      return;
    }

    const planningMap: Record<string, PlanningEntry> = {};
    data?.forEach(entry => {
      planningMap[entry.client_id] = entry;
    });
    setPlanningData(planningMap);
  };

  useEffect(() => {
    fetchPlanningData();
  }, [selectedDate]);

  const getStatusColor = (status: string) => {
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
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    
    const { data, error } = await supabase
      .from('publication_planning')
      .upsert({
        client_id: clientId,
        month: startOfMonth.toISOString(),
        status: newStatus,
        description: planningData[clientId]?.description || ''
      }, {
        onConflict: 'client_id,month'
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
      return;
    }

    setPlanningData(prev => ({
      ...prev,
      [clientId]: data
    }));

    toast({
      title: "Estado actualizado",
      description: "El estado se ha actualizado correctamente",
    });
  };

  const handleDescriptionSave = async () => {
    if (!selectedClient) return;

    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    
    const { error } = await supabase
      .from('publication_planning')
      .upsert({
        client_id: selectedClient,
        month: startOfMonth.toISOString(),
        status: planningData[selectedClient]?.status || 'consultar',
        description
      }, {
        onConflict: 'client_id,month'
      });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la descripción",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Descripción guardada",
      description: "La descripción se ha guardado correctamente",
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Planificación: {format(selectedDate, 'MMMM yyyy', { locale: es })}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map(client => (
          <div
            key={client.id}
            className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
            onContextMenu={(e) => {
              e.preventDefault();
              const status = planningData[client.id]?.status || 'consultar';
              const nextStatus = status === 'hacer' ? 'no_hacer' : 
                               status === 'no_hacer' ? 'consultar' : 'hacer';
              handleStatusChange(client.id, nextStatus);
            }}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{client.name}</span>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className={`w-4 h-4 rounded-full cursor-pointer ${getStatusColor(planningData[client.id]?.status || 'consultar')}`} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'hacer')}>
                      <div className="w-4 h-4 rounded-full bg-green-500 mr-2" />
                      Hacer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'no_hacer')}>
                      <div className="w-4 h-4 rounded-full bg-red-500 mr-2" />
                      No hacer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'consultar')}>
                      <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2" />
                      Consultar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedClient(client.id);
                    setDescription(planningData[client.id]?.description || '');
                    setIsDialogOpen(true);
                  }}
                >
                  Descripción
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descripción de planificación</DialogTitle>
          </DialogHeader>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ingrese la descripción..."
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDescriptionSave}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-md border"
          locale={es}
        />
      </div>
    </div>
  );
};