import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PublicationFormProps {
  onSubmit: (values: {
    name: string;
    type: 'reel' | 'carousel' | 'image';
    date: Date;
    description: string;
  }) => void;
  isSubmitting?: boolean;
  packageId?: string;
}

export const PublicationForm = ({ onSubmit, isSubmitting, packageId }: PublicationFormProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<'reel' | 'carousel' | 'image'>("image");
  const [date, setDate] = useState<Date>();
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name) return;
    onSubmit({ name, type, date, description });
    setName("");
    setType("image");
    setDate(undefined);
    setDescription("");
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
        <Select value={type} onValueChange={(value: 'reel' | 'carousel' | 'image') => setType(value)}>
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
        <div className="border rounded-lg p-2 max-h-[300px] overflow-y-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border dark:bg-gray-800 dark:text-white"
          />
        </div>
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