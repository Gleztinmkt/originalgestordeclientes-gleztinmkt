import { useState } from "react";
import { Mic, Send, Calendar, Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { format } from "date-fns";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

interface TaskInputProps {
  onAddTask: (task: string, clientId?: string, type?: string, executionDate?: Date, reminderDate?: Date, reminderFrequency?: string) => void;
  clients: Array<{ id: string; name: string }>;
}

export const TaskInput = ({ onAddTask, clients }: TaskInputProps) => {
  const [input, setInput] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("no_client");
  const [selectedType, setSelectedType] = useState<string>("otros");
  const [isListening, setIsListening] = useState(false);
  const [executionDate, setExecutionDate] = useState<Date>();
  const [reminderDate, setReminderDate] = useState<Date>();
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState<string>("once");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAddTask(
        input.trim(), 
        selectedClient === "no_client" ? undefined : selectedClient, 
        selectedType, 
        executionDate,
        enableReminder ? reminderDate : undefined,
        enableReminder ? reminderFrequency : undefined
      );
      setInput("");
      setSelectedClient("no_client");
      setSelectedType("otros");
      setExecutionDate(undefined);
      setReminderDate(undefined);
      setEnableReminder(false);
      toast({
        title: "Tarea agregada",
        description: "Tu tarea ha sido agregada exitosamente.",
      });
    }
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast({
        title: "No soportado",
        description: "Tu navegador no soporta el reconocimiento de voz.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Error",
        description: "Hubo un error con el reconocimiento de voz.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-2xl mx-auto">
      <div className="flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Agregar una nueva tarea..."
          className="flex-1 dark:bg-gray-800 dark:text-white"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={startListening}
          className={`transition-colors dark:bg-gray-800 dark:text-white ${
            isListening ? "bg-accent text-accent-foreground" : ""
          }`}
        >
          <Mic className="h-4 w-4" />
        </Button>
        <Button type="submit" size="icon" className="dark:bg-gray-700">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="flex-1 min-w-[200px] dark:bg-gray-800 dark:text-white">
            <SelectValue placeholder="Seleccionar cliente" />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800">
            <SelectItem value="no_client">Sin cliente</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id || "no_client"}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="flex-1 min-w-[200px] dark:bg-gray-800 dark:text-white">
            <SelectValue placeholder="Tipo de tarea" />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800">
            <SelectItem value="campaña">Campaña</SelectItem>
            <SelectItem value="publicaciones">Publicaciones</SelectItem>
            <SelectItem value="correcciones">Correcciones</SelectItem>
            <SelectItem value="otros">Otros</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[200px] dark:bg-gray-800 dark:text-white">
              <Calendar className="mr-2 h-4 w-4" />
              {executionDate ? format(executionDate, "PPP") : "Fecha de ejecución"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 dark:bg-gray-800">
            <CalendarComponent
              mode="single"
              selected={executionDate}
              onSelect={setExecutionDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center space-x-2 min-w-[200px]">
          <Switch
            id="reminder"
            checked={enableReminder}
            onCheckedChange={setEnableReminder}
          />
          <Label htmlFor="reminder" className="dark:text-white">Recordatorio</Label>
        </div>

        {enableReminder && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] dark:bg-gray-800 dark:text-white">
                  <Bell className="mr-2 h-4 w-4" />
                  {reminderDate ? format(reminderDate, "PPP") : "Fecha recordatorio"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 dark:bg-gray-800">
                <CalendarComponent
                  mode="single"
                  selected={reminderDate}
                  onSelect={setReminderDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={reminderFrequency} onValueChange={setReminderFrequency}>
              <SelectTrigger className="min-w-[200px] dark:bg-gray-800 dark:text-white">
                <SelectValue placeholder="Frecuencia" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800">
                <SelectItem value="once">Una vez</SelectItem>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>
    </form>
  );
};