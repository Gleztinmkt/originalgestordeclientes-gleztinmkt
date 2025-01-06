import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { PublicationType } from "./types";

interface PublicationFormProps {
  onSubmit: (values: {
    name: string;
    type: PublicationType;
    date: Date | undefined;
    description: string;
  }) => void;
  isSubmitting?: boolean;
}

export const PublicationForm = ({ onSubmit, isSubmitting }: PublicationFormProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<PublicationType>("image");
  const [date, setDate] = useState<Date>();
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name) return;
    onSubmit({ name, type, date, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Select value={type} onValueChange={(value: PublicationType) => setType(value)}>
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
        <Button type="submit" disabled={isSubmitting}>
          Agregar publicación
        </Button>
      </div>
    </form>
  );
};