import { useState } from "react";
import { Mic, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "@/hooks/use-toast";

interface TaskInputProps {
  onAddTask: (task: string) => void;
}

export const TaskInput = ({ onAddTask }: TaskInputProps) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAddTask(input.trim());
      setInput("");
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
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-2xl mx-auto">
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
    </form>
  );
};