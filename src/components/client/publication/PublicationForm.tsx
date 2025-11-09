import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { es } from "date-fns/locale";
import { Publication } from "./types";
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
    copywriting: string;
  }) => void;
  isSubmitting?: boolean;
  packageId?: string;
  editingPublication?: Publication | null;
  onCancelEdit?: () => void;
  publicationDates?: Date[];
}

export const PublicationForm = ({ 
  onSubmit, 
  isSubmitting, 
  packageId, 
  editingPublication,
  onCancelEdit,
  publicationDates = []
}: PublicationFormProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<'reel' | 'carousel' | 'image'>('image');
  const [date, setDate] = useState<Date>();
  const [description, setDescription] = useState("");
  const [copywriting, setCopywriting] = useState("");

  // Load publication data when editing
  useEffect(() => {
    if (editingPublication) {
      setName(editingPublication.name);
      setType(editingPublication.type as 'reel' | 'carousel' | 'image');
      setDate(new Date(editingPublication.date));
      setDescription(editingPublication.description || "");
      setCopywriting(editingPublication.copywriting || "");
    }
  }, [editingPublication]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name) return;
    onSubmit({ name, type, date, description, copywriting });
    
    // Reset form only if not editing
    if (!editingPublication) {
      setName("");
      setType("image");
      setDate(undefined);
      setDescription("");
      setCopywriting("");
    }
  };

  const handleCancel = () => {
    setName("");
    setType("image");
    setDate(undefined);
    setDescription("");
    setCopywriting("");
    onCancelEdit?.();
  };

  // Check if a date has publications
  const hasPublicationOnDate = (checkDate: Date) => {
    return publicationDates.some(pubDate => 
      pubDate.getDate() === checkDate.getDate() &&
      pubDate.getMonth() === checkDate.getMonth() &&
      pubDate.getFullYear() === checkDate.getFullYear()
    );
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
            locale={es}
            className="rounded-md border dark:bg-gray-800 dark:text-white"
            modifiers={{
              hasPublication: (date) => hasPublicationOnDate(date)
            }}
            modifiersStyles={{
              hasPublication: { 
                backgroundColor: 'hsl(var(--primary) / 0.2)',
                fontWeight: 'bold',
                border: '2px solid hsl(var(--primary))'
              }
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="copywriting">Copywriting</Label>
        <Textarea
          id="copywriting"
          value={copywriting}
          onChange={(e) => setCopywriting(e.target.value)}
          className="dark:bg-gray-800 dark:text-white min-h-[100px]"
          placeholder="Ingresa el copywriting para esta publicación..."
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

      <div className="flex justify-end gap-2">
        {editingPublication && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {editingPublication ? 'Actualizar publicación' : 'Agregar publicación'}
        </Button>
      </div>
    </form>
  );
};