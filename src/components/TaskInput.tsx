import { useState } from "react";
import { Mic, Send, Plus } from "lucide-react";
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
import { ClientForm } from "./ClientForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TaskInputProps {
  onAddTask: (task: string, clientId?: string) => void;
  clients: Array<{ id: string; name: string }>;
}

export const TaskInput = ({ onAddTask, clients }: TaskInputProps) => {
  const [input, setInput] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAddTask(input.trim(), selectedClient);
      setInput("");
      setSelectedClient("");
      toast({
        title: "Tarea agregada",
        description: "Tu tarea ha sido agregada exitosamente.",
      });
    }
  };

  const handleAddClient = (clientData: any) => {
    setIsClientDialogOpen(false);
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
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={startListening}
          className={`transition-colors ${
            isListening ? "bg-accent text-accent-foreground" : ""
          }`}
        >
          <Mic className="h-4 w-4" />
        </Button>
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex gap-2 items-center">
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Seleccionar cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Agrega un nuevo cliente para asignarle esta tarea
              </DialogDescription>
            </DialogHeader>
            <ClientForm onAddClient={handleAddClient} />
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
};