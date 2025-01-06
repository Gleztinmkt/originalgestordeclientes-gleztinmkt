import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PublicationCalendarDialogProps {
  clientId: string;
  clientName: string;
}

export const PublicationCalendarDialog = ({ clientId, clientName }: PublicationCalendarDialogProps) => {
  const [date, setDate] = useState<Date>();
  const [name, setName] = useState("");
  const [type, setType] = useState<"reel" | "carousel" | "image">("image");
  const [description, setDescription] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('publications')
        .insert([
          {
            client_id: clientId,
            name,
            type,
            date,
            description
          }
        ]);

      if (error) throw error;

      toast({
        title: "Publicación agregada",
        description: "La publicación se ha agregado correctamente.",
      });

      setName("");
      setType("image");
      setDescription("");
      setDate(undefined);
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding publication:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la publicación. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors duration-200"
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold dark:text-white">
            Calendario de publicaciones - {clientName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la publicación</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de publicación</Label>
            <Select value={type} onValueChange={(value: "reel" | "carousel" | "image") => setType(value)}>
              <SelectTrigger className="dark:bg-gray-800 dark:text-white">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800">
                <SelectItem value="reel">Reel</SelectItem>
                <SelectItem value="carousel">Carrusel</SelectItem>
                <SelectItem value="image">Imagen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha de publicación</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Agregar publicación</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};