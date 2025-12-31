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
import { Loader2, Sparkles, Calendar as CalendarIcon, Check, X, Plus, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DetectedPublication {
  title: string;
  type: 'reel' | 'carousel' | 'image';
  description?: string;
  copywriting?: string;
  date?: Date;
  validated?: boolean;
  status: string;
  designer: string;
  links: Array<{ label: string; url: string }>;
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
  const [newLinkLabels, setNewLinkLabels] = useState<{ [key: number]: string }>({});
  const [newLinkUrls, setNewLinkUrls] = useState<{ [key: number]: string }>({});

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
          validated: false,
          status: 'needs_recording',
          designer: 'no_designer',
          links: []
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

  const addLinkToPublication = (index: number) => {
    const label = newLinkLabels[index] || '';
    const url = newLinkUrls[index] || '';
    if (label && url) {
      const currentLinks = publications[index].links || [];
      updatePublication(index, 'links', [...currentLinks, { label, url }]);
      setNewLinkLabels(prev => ({ ...prev, [index]: '' }));
      setNewLinkUrls(prev => ({ ...prev, [index]: '' }));
    }
  };

  const removeLinkFromPublication = (pubIndex: number, linkIndex: number) => {
    const currentLinks = [...publications[pubIndex].links];
    currentLinks.splice(linkIndex, 1);
    updatePublication(pubIndex, 'links', currentLinks);
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
      const insertData = publications.map(pub => {
        // Convert status to boolean flags
        const statusFlags = {
          needs_recording: pub.status === 'needs_recording',
          needs_editing: pub.status === 'needs_editing',
          in_editing: pub.status === 'in_editing',
          in_review: pub.status === 'in_review',
          approved: pub.status === 'approved',
          is_published: pub.status === 'published'
        };

        return {
          client_id: clientId,
          package_id: packageId || null,
          name: pub.title,
          type: pub.type,
          date: pub.date!.toISOString(),
          description: pub.description || null,
          copywriting: pub.copywriting || null,
          links: pub.links.length > 0 ? JSON.stringify(pub.links) : null,
          designer: pub.designer === 'no_designer' ? null : pub.designer,
          ...statusFlags
        };
      });

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

                        {/* Estado y Diseñador */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Estado</Label>
                            <Select
                              value={pub.status}
                              onValueChange={(value) => updatePublication(index, 'status', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="needs_recording">Falta grabar</SelectItem>
                                <SelectItem value="needs_editing">Falta editar</SelectItem>
                                <SelectItem value="in_editing">En edición</SelectItem>
                                <SelectItem value="in_review">En revisión</SelectItem>
                                <SelectItem value="approved">Aprobado</SelectItem>
                                <SelectItem value="published">Publicado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Diseñador</Label>
                            <Select
                              value={pub.designer}
                              onValueChange={(value) => updatePublication(index, 'designer', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar diseñador" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no_designer">Sin diseñador</SelectItem>
                                {designers.map(d => (
                                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
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

                        {/* Enlaces */}
                        <div>
                          <Label>Enlaces</Label>
                          <Card className="mt-2">
                            <CardContent className="p-3 space-y-3">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Input
                                  placeholder="Etiqueta"
                                  value={newLinkLabels[index] || ''}
                                  onChange={e => setNewLinkLabels(prev => ({ ...prev, [index]: e.target.value }))}
                                  className="text-sm flex-1"
                                />
                                <Input
                                  placeholder="URL"
                                  value={newLinkUrls[index] || ''}
                                  onChange={e => setNewLinkUrls(prev => ({ ...prev, [index]: e.target.value }))}
                                  className="text-sm flex-1"
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => addLinkToPublication(index)}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              {pub.links.length > 0 && (
                                <ScrollArea className="h-[80px]">
                                  <div className="space-y-2">
                                    {pub.links.map((link, linkIdx) => (
                                      <div key={linkIdx} className="flex items-center gap-2 bg-secondary p-2 rounded text-sm">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeLinkFromPublication(index, linkIdx)}
                                          className="text-destructive h-6 w-6 p-0"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                        <span className="flex-1 truncate">{link.label}</span>
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              )}
                            </CardContent>
                          </Card>
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
                        <p><span className="font-medium">Estado:</span> {pub.status === 'needs_recording' ? 'Falta grabar' : pub.status === 'needs_editing' ? 'Falta editar' : pub.status === 'in_editing' ? 'En edición' : pub.status === 'in_review' ? 'En revisión' : pub.status === 'approved' ? 'Aprobado' : 'Publicado'}</p>
                        <p><span className="font-medium">Diseñador:</span> {pub.designer === 'no_designer' ? 'Sin diseñador' : pub.designer}</p>
                        <p><span className="font-medium">Fecha:</span> {pub.date ? format(pub.date, "d 'de' MMMM, yyyy", { locale: es }) : 'No definida'}</p>
                        {pub.links.length > 0 && <p><span className="font-medium">Enlaces:</span> {pub.links.length}</p>}
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
