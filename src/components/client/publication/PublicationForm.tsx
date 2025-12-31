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
import { Sparkles, ChevronDown, Loader2, Plus, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { BulkPublicationDialog } from "./BulkPublicationDialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PublicationFormProps {
  onSubmit: (values: {
    name: string;
    type: 'reel' | 'carousel' | 'image';
    date: Date;
    description: string;
    copywriting: string;
    status?: string;
    designer?: string | null;
    links?: string;
  }) => void;
  isSubmitting?: boolean;
  packageId?: string;
  editingPublication?: Publication | null;
  onCancelEdit?: () => void;
  publicationDates?: Date[];
  clientId: string;
  existingPublications: Array<{ date: string }>;
  onPublicationsChange: () => void;
}

export const PublicationForm = ({ 
  onSubmit, 
  isSubmitting, 
  packageId, 
  editingPublication,
  onCancelEdit,
  publicationDates = [],
  clientId,
  existingPublications,
  onPublicationsChange
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
  const [status, setStatus] = useState("needs_recording");
  const [designer, setDesigner] = useState<string>("no_designer");
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>([]);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Fetch designers
  const { data: designers = [] } = useQuery({
    queryKey: ['designers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('designers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Load publication data when editing
  useEffect(() => {
    if (editingPublication) {
      setName(editingPublication.name);
      setType(editingPublication.type as 'reel' | 'carousel' | 'image');
      setDate(new Date(editingPublication.date));
      setDescription(editingPublication.description || "");
      setCopywriting(editingPublication.copywriting || "");
      
      // Set status based on publication flags
      const pubStatus = editingPublication.is_published ? 'published' :
        editingPublication.approved ? 'approved' :
        editingPublication.in_review ? 'in_review' :
        editingPublication.in_editing ? 'in_editing' :
        editingPublication.needs_editing ? 'needs_editing' : 'needs_recording';
      setStatus(pubStatus);
      
      setDesigner(editingPublication.designer || "no_designer");
      
      // Parse links
      if (editingPublication.links) {
        try {
          setLinks(JSON.parse(editingPublication.links));
        } catch (e) {
          console.error('Error parsing links:', e);
          setLinks([]);
        }
      } else {
        setLinks([]);
      }
    } else {
      // Reset to defaults for new publication
      setStatus("needs_recording");
      setDesigner("no_designer");
      setLinks([]);
    }
  }, [editingPublication]);

  const handleAddLink = () => {
    if (newLinkLabel && newLinkUrl) {
      setLinks([...links, { label: newLinkLabel, url: newLinkUrl }]);
      setNewLinkLabel("");
      setNewLinkUrl("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name) return;
    onSubmit({ 
      name, 
      type, 
      date, 
      description, 
      copywriting,
      status,
      designer: designer === "no_designer" ? null : designer,
      links: JSON.stringify(links)
    });
    
    // Reset form only if not editing
    if (!editingPublication) {
      setName("");
      setType("image");
      setDate(undefined);
      setDescription("");
      setCopywriting("");
      setStatus("needs_recording");
      setDesigner("no_designer");
      setLinks([]);
    }
  };

  const handleCancel = () => {
    setName("");
    setType("image");
    setDate(undefined);
    setDescription("");
    setCopywriting("");
    setAiContent("");
    setStatus("needs_recording");
    setDesigner("no_designer");
    setLinks([]);
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
      {/* Botones de carga con IA */}
      <div className="flex gap-2">
        <BulkPublicationDialog
          clientId={clientId}
          packageId={packageId}
          existingPublications={existingPublications}
          onSuccess={onPublicationsChange}
        />
      </div>

      {/* Carga Individual con IA */}
      <Collapsible open={isAiOpen} onOpenChange={setIsAiOpen} className="border border-border rounded-lg p-4 bg-muted/30">
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">🪄 Carga Individual con IA</span>
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

      {/* Estado y Diseñador - siempre visibles */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="dark:bg-gray-800 dark:text-white">
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800">
              <SelectItem value="needs_recording">Falta grabar</SelectItem>
              <SelectItem value="needs_editing">Falta editar</SelectItem>
              <SelectItem value="in_editing">En edición</SelectItem>
              <SelectItem value="in_review">En revisión</SelectItem>
              <SelectItem value="approved">Aprobado</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Diseñador</Label>
          <Select value={designer} onValueChange={setDesigner}>
            <SelectTrigger className="dark:bg-gray-800 dark:text-white">
              <SelectValue placeholder="Seleccionar diseñador" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800">
              <SelectItem value="no_designer">Sin diseñador</SelectItem>
              {designers.map(d => (
                <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      {/* Links - siempre visibles */}
      <div className="space-y-2">
        <Label>Enlaces</Label>
        <Card>
          <CardContent className="p-3 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Etiqueta"
                  value={newLinkLabel}
                  onChange={e => setNewLinkLabel(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="URL"
                  value={newLinkUrl}
                  onChange={e => setNewLinkUrl(e.target.value)}
                  className="text-sm"
                />
              </div>
              <Button type="button" variant="outline" onClick={handleAddLink} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {links.length > 0 && (
              <ScrollArea className="h-[100px]">
                <div className="space-y-2">
                  {links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 bg-secondary p-2 rounded text-sm">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newLinks = [...links];
                          newLinks.splice(index, 1);
                          setLinks(newLinks);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <span className="flex-1 truncate">{link.label}</span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
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