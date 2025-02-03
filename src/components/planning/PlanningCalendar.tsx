import { useState, useEffect } from 'react';
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
import { MonthSelector } from "./MonthSelector";
import { StatusLegend } from "./StatusLegend";
import { Card } from "@/components/ui/card";
import { CalendarIcon, Clock } from "lucide-react";

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
      .eq('month', startOfMonth.toISOString());

    if (error) {
      console.error('Error fetching planning data:', error);
      return;
    }

    const planningMap: Record<string, PlanningEntry> = {};
    data?.forEach(entry => {
      planningMap[entry.client_id] = {
        id: entry.id,
        client_id: entry.client_id,
        month: entry.month,
        status: (entry.status || 'consultar') as 'hacer' | 'no_hacer' | 'consultar',
        description: entry.description
      };
    });
    setPlanningData(planningMap);
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
      [clientId]: {
        id: data.id,
        client_id: data.client_id,
        month: data.month,
        status: data.status as 'hacer' | 'no_hacer' | 'consultar',
        description: data.description
      }
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
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
      <StatusLegend getStatusColor={getStatusColor} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map(client => {
          const planningEntry = planningData[client.id];
          const paymentDay = client.paymentDay || 1;
          const currentMonth = selectedDate.getMonth();
          const currentYear = selectedDate.getFullYear();
          const paymentDate = new Date(currentYear, currentMonth, paymentDay);
          const creationDate = new Date(currentYear, currentMonth, Math.max(1, paymentDay - 7));

          return (
            <Card
              key={client.id}
              className="p-4 hover:shadow-lg transition-shadow duration-200"
              onContextMenu={(e) => {
                e.preventDefault();
                const status = planningData[client.id]?.status || 'consultar';
                const nextStatus = status === 'hacer' ? 'no_hacer' : 
                                 status === 'no_hacer' ? 'consultar' : 'hacer';
                handleStatusChange(client.id, nextStatus);
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Pago: {format(paymentDate, 'd MMMM', { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>Creación: {format(creationDate, 'd MMMM', { locale: es })}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className={`w-4 h-4 rounded-full cursor-pointer ${getStatusColor(planningEntry?.status || 'consultar')}`} />
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
                </div>
              </div>

              <Button
                variant="ghost"
                className="w-full text-left justify-start h-auto py-2 px-3"
                onClick={() => {
                  setSelectedClient(client.id);
                  setDescription(planningData[client.id]?.description || '');
                  setIsDialogOpen(true);
                }}
              >
                {planningData[client.id]?.description ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {planningData[client.id].description}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    Agregar descripción...
                  </p>
                )}
              </Button>
            </Card>
          );
        })}
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
    </div>
  );
};