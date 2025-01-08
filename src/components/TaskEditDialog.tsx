import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { Task } from "./TaskList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

interface TaskEditDialogProps {
  task: Task;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  clients: Array<{ id: string; name: string }>;
}

type TaskType = "campaña" | "publicaciones" | "correcciones" | "otros";

export const TaskEditDialog = ({ task, onClose, onSave, clients }: TaskEditDialogProps) => {
  const [content, setContent] = useState(task.content);
  const [type, setType] = useState<TaskType>(task.type as TaskType);
  const [clientId, setClientId] = useState(task.clientId || "");
  const [executionDate, setExecutionDate] = useState<Date | undefined>(
    task.executionDate ? new Date(task.executionDate) : undefined
  );
  const [enableReminder, setEnableReminder] = useState(!!task.reminderDate);
  const [reminderDate, setReminderDate] = useState<Date | undefined>(
    task.reminderDate ? new Date(task.reminderDate) : undefined
  );
  const [reminderFrequency, setReminderFrequency] = useState(task.reminderFrequency || "once");

  const handleSave = () => {
    onSave({
      content,
      type,
      clientId: clientId || null,
      executionDate,
      reminderDate: enableReminder ? reminderDate : undefined,
      reminderFrequency: enableReminder ? reminderFrequency : undefined,
    });
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar tarea</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Contenido</Label>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(value: TaskType) => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="campaña">Campaña</SelectItem>
                <SelectItem value="publicaciones">Publicaciones</SelectItem>
                <SelectItem value="correcciones">Correcciones</SelectItem>
                <SelectItem value="otros">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin cliente</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Fecha de ejecución</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`justify-start text-left font-normal ${
                    !executionDate && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {executionDate ? format(executionDate, "PPP") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={executionDate}
                  onSelect={setExecutionDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="reminder"
              checked={enableReminder}
              onCheckedChange={setEnableReminder}
            />
            <Label htmlFor="reminder">Recordatorio</Label>
          </div>

          {enableReminder && (
            <>
              <div className="grid gap-2">
                <Label>Fecha de recordatorio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`justify-start text-left font-normal ${
                        !reminderDate && "text-muted-foreground"
                      }`}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      {reminderDate ? format(reminderDate, "PPP") : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={reminderDate}
                      onSelect={setReminderDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>Frecuencia del recordatorio</Label>
                <Select value={reminderFrequency} onValueChange={setReminderFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Una vez</SelectItem>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
