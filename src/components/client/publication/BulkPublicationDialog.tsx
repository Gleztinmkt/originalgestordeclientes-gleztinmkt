import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Calendar as CalendarIcon, Check, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DetectedPublication {
  title: string;
  type: 'reel' | 'carousel' | 'image';
  description?: string;
  copywriting?: string;
  date?: Date;
  validated?: boolean;
}

interface BulkPublicationDialogProps {
  clientId: string;
  packageId?: string;
  existingPublications: Array<{ date: string }>;
  onSuccess: () => void;
}

export function BulkPublicationDialog({ clientId, packageId, existingPublications, onSuccess }: BulkPublicationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [publications, setPublications] = useState<DetectedPublication[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast.error("Ingresa el contenido del calendario");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-multiple-publications', {
        body: { content }
      });

      if (error) throw error;

      if (data?.publications && Array.isArray(data.publications)) {
        setPublications(data.publications.map((pub: any) => ({
          ...pub,
          date: undefined,
          validated: false
        })));
        toast.success(`Se detectaron ${data.publications.length} publicaciones`);
      } else {
        toast.error("No se detectaron publicaciones");
      }
    } catch (error: any) {
      console.error('Error al analizar:', error);
      toast.error(error.message || "Error al analizar el calendario");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updatePublication = (index: number, field: keyof DetectedPublication, value: any) => {
    setPublications(prev => prev.map((pub, i) => 
      i === index ? { ...pub, [field]: value } : pub
    ));
  };

  const validatePublication = (index: number) => {
    const pub = publications[index];
    if (!pub.date) {
      toast.error("Selecciona una fecha para esta publicación");
      return;
    }
    updatePublication(index, 'validated', true);
    setEditingIndex(null);
    toast.success("Publicación validada");
  };

  const handleSaveAll = async () => {
    const unvalidated = publications.filter(pub => !pub.validated);
    if (unvalidated.length > 0) {
      toast.error(`Valida todas las publicaciones antes de guardar (${unvalidated.length} pendientes)`);
      return;
    }

    setIsSaving(true);
    try {
      const insertData = publications.map(pub => ({
        client_id: clientId,
        package_id: packageId || null,
        name: pub.title,
        type: pub.type,
        date: pub.date!.toISOString(),
        description: pub.description || null,
        copywriting: pub.copywriting || null,
        is_published: false
      }));

      const { error } = await supabase
        .from('publications')
        .insert(insertData);

      if (error) throw error;

      toast.success(`${publications.length} publicaciones guardadas exitosamente`);
      onSuccess();
      setIsOpen(false);
      setContent("");
      setPublications([]);
    } catch (error: any) {
      console.error('Error al guardar:', error);
      toast.error("Error al guardar las publicaciones");
    } finally {
      setIsSaving(false);
    }
  };

  const hasPublicationOnDate = (date: Date, currentIndex?: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check existing publications
    const hasExisting = existingPublications.some(pub => pub.date.startsWith(dateStr));
    
    // Check publications already assigned in this bulk load (excluding current one being edited)
    const hasInBulk = publications.some((pub, idx) => 
      idx !== currentIndex && pub.date && format(pub.date, 'yyyy-MM-dd') === dateStr
    );
    
    return hasExisting || hasInBulk;
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <CalendarIcon className="h-4 w-4" />
        Carga Masiva con IA
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Carga Masiva de Publicaciones con IA
            </DialogTitle>
          </DialogHeader>

          {publications.length === 0 ? (
            <div className="space-y-4">
              <div>
                <Label>Pega todo el calendario de publicaciones</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ejemplo:&#10;&#10;1. REEL – Video Institucional&#10;Descripción: Video mostrando el gimnasio...&#10;Texto publicación: 💪 Bienvenidos a...&#10;&#10;2. IMAGEN – Promoción&#10;..."
                  className="min-h-[200px] mt-2"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !content.trim()}
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
                    Analizar Calendario
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {publications.filter(p => p.validated).length} de {publications.length} validadas
                </p>
                <Button
                  onClick={() => {
                    setPublications([]);
                    setContent("");
                  }}
                  variant="outline"
                  size="sm"
                >
                  Volver a analizar
                </Button>
              </div>

              <div className="space-y-3">
                {publications.map((pub, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      pub.validated ? 'bg-green-50 border-green-200' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        {pub.validated && <Check className="h-4 w-4 text-green-600" />}
                        {index + 1}. {pub.title}
                      </h4>
                      {pub.validated ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            updatePublication(index, 'validated', false);
                            setEditingIndex(index);
                          }}
                        >
                          Editar
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                        >
                          {editingIndex === index ? <X className="h-4 w-4" /> : 'Editar'}
                        </Button>
                      )}
                    </div>

                    {(editingIndex === index || !pub.validated) && (
                      <div className="space-y-3">
                        <div>
                          <Label>Nombre</Label>
                          <Input
                            value={pub.title}
                            onChange={(e) => updatePublication(index, 'title', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label>Tipo</Label>
                          <Select
                            value={pub.type}
                            onValueChange={(value) => updatePublication(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="reel">Reel</SelectItem>
                              <SelectItem value="carousel">Carrusel</SelectItem>
                              <SelectItem value="image">Imagen</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Fecha de publicación</Label>
                          <Calendar
                            mode="single"
                            selected={pub.date}
                            onSelect={(date) => updatePublication(index, 'date', date)}
                            locale={es}
                            className="rounded-md border mt-2"
                            modifiers={{
                              hasPublication: (date) => hasPublicationOnDate(date, index)
                            }}
                            modifiersStyles={{
                              hasPublication: {
                                backgroundColor: 'hsl(var(--primary) / 0.1)',
                                fontWeight: 'bold'
                              }
                            }}
                          />
                          {pub.date && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Fecha seleccionada: {format(pub.date, "d 'de' MMMM, yyyy", { locale: es })}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Descripción</Label>
                          <Textarea
                            value={pub.description || ""}
                            onChange={(e) => updatePublication(index, 'description', e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>

                        <div>
                          <Label>Copywriting</Label>
                          <Textarea
                            value={pub.copywriting || ""}
                            onChange={(e) => updatePublication(index, 'copywriting', e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>

                        <Button
                          onClick={() => validatePublication(index)}
                          className="w-full"
                          variant={pub.date ? "default" : "outline"}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Validar publicación
                        </Button>
                      </div>
                    )}

                    {pub.validated && (
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Tipo:</span> {pub.type}</p>
                        <p><span className="font-medium">Fecha:</span> {pub.date ? format(pub.date, "d 'de' MMMM, yyyy", { locale: es }) : 'No definida'}</p>
                        {pub.description && <p><span className="font-medium">Descripción:</span> {pub.description}</p>}
                        {pub.copywriting && <p><span className="font-medium">Copy:</span> {pub.copywriting.substring(0, 100)}...</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSaveAll}
                disabled={isSaving || publications.some(p => !p.validated)}
                className="w-full"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  `Guardar ${publications.length} Publicaciones`
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
