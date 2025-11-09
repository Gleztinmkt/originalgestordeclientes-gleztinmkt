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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sparkles, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<'reel' | 'carousel' | 'image'>('image');
  const [date, setDate] = useState<Date>();
  const [description, setDescription] = useState("");
  const [copywriting, setCopywriting] = useState("");
  const [aiContent, setAiContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

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
    setAiContent("");
    onCancelEdit?.();
  };

  const handleAiAnalysis = async () => {
    if (!aiContent.trim()) {
      toast({
        title: "Error",
        description: "Por favor pega el contenido a analizar",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-publication', {
        body: { content: aiContent }
      });

      if (error) {
        console.error('Error al analizar:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Auto-rellenar los campos
      if (data.title) setName(data.title);
      if (data.type) setType(data.type);
      if (data.description) setDescription(data.description);
      if (data.copywriting) setCopywriting(data.copywriting);

      toast({
        title: "✨ Análisis completado",
        description: "Los campos se han rellenado automáticamente. Puedes editarlos antes de guardar.",
      });

      // Colapsar el componente después del análisis exitoso
      setIsAiOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error al analizar",
        description: error instanceof Error ? error.message : "No se pudo analizar el contenido. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
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
      {/* Carga Automática con IA */}
      <Collapsible open={isAiOpen} onOpenChange={setIsAiOpen} className="border border-border rounded-lg p-4 bg-muted/30">
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">🪄 Carga Automática con IA</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isAiOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ai-content" className="text-sm text-muted-foreground">
              Pega aquí el contenido completo de la publicación
            </Label>
            <Textarea
              id="ai-content"
              value={aiContent}
              onChange={(e) => setAiContent(e.target.value)}
              placeholder="Ejemplo:&#10;1. Video Institucional con Denise...&#10;Duración: 45-60 segundos&#10;...&#10;Texto publicación:&#10;💪 En Glúteos de Acero..."
              className="min-h-[150px] font-mono text-sm"
              disabled={isAnalyzing}
            />
          </div>
          <Button
            type="button"
            onClick={handleAiAnalysis}
            disabled={isAnalyzing || !aiContent.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando con IA...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analizar y Auto-rellenar
              </>
            )}
          </Button>
        </CollapsibleContent>
      </Collapsible>

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