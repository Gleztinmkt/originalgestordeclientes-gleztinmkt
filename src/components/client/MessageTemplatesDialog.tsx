import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  FileText,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  description: string | null;
  is_default: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

interface MessageTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { value: "pago", label: "Pagos" },
  { value: "valores", label: "Valores" },
  { value: "general", label: "General" },
  { value: "promocion", label: "Promociones" },
  { value: "seguimiento", label: "Seguimiento" },
];

const VARIABLES = [
  { name: "{nombre}", description: "Nombre del cliente" },
  { name: "{dia_pago}", description: "Día de pago del cliente" },
  { name: "{plazo_inicio}", description: "5 días antes del día de pago" },
];

export const MessageTemplatesDialog = ({
  open,
  onOpenChange,
}: MessageTemplatesDialogProps) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    description: "",
    category: "general",
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("message_templates")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las plantillas",
        variant: "destructive",
      });
    } else {
      setTemplates(data || []);
    }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "El nombre y contenido son obligatorios",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("message_templates").insert({
      name: formData.name,
      content: formData.content,
      description: formData.description || null,
      category: formData.category,
    });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la plantilla",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Plantilla creada",
        description: "La plantilla se ha guardado correctamente",
      });
      setIsCreating(false);
      setFormData({ name: "", content: "", description: "", category: "general" });
      fetchTemplates();
    }
  };

  const handleUpdate = async () => {
    if (!editingTemplate) return;

    const { error } = await supabase
      .from("message_templates")
      .update({
        name: formData.name,
        content: formData.content,
        description: formData.description || null,
        category: formData.category,
      })
      .eq("id", editingTemplate.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la plantilla",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Plantilla actualizada",
        description: "Los cambios se han guardado correctamente",
      });
      setEditingTemplate(null);
      setFormData({ name: "", content: "", description: "", category: "general" });
      fetchTemplates();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("message_templates")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la plantilla",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla se ha eliminado correctamente",
      });
      fetchTemplates();
    }
  };

  const startEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      description: template.description || "",
      category: template.category,
    });
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setFormData({ name: "", content: "", description: "", category: "general" });
  };

  const cancelEdit = () => {
    setEditingTemplate(null);
    setIsCreating(false);
    setFormData({ name: "", content: "", description: "", category: "general" });
  };

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content + variable,
    }));
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gestionar Plantillas de Mensajes
          </DialogTitle>
          <DialogDescription>
            Crea y edita plantillas para enviar mensajes masivos a tus clientes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Lista de plantillas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Plantillas existentes</h3>
              <Button size="sm" onClick={startCreate} disabled={isCreating}>
                <Plus className="h-4 w-4 mr-1" />
                Nueva
              </Button>
            </div>

            <ScrollArea className="h-[400px] rounded-md border p-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Cargando...
                </div>
              ) : templates.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay plantillas
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        editingTemplate?.id === template.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => startEdit(template)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {template.name}
                            </span>
                            {template.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                Por defecto
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {getCategoryLabel(template.category)}
                          </Badge>
                          {template.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {template.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(template);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(template.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Formulario de edición/creación */}
          <div className="space-y-4">
            {(isCreating || editingTemplate) && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {isCreating ? "Nueva plantilla" : "Editar plantilla"}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={cancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ej: Recordatorio de pago"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Breve descripción de la plantilla"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content">Contenido del mensaje</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Info className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p className="font-medium mb-1">Variables disponibles:</p>
                            <ul className="text-xs space-y-1">
                              {VARIABLES.map((v) => (
                                <li key={v.name}>
                                  <code className="bg-muted px-1 rounded">{v.name}</code>
                                  {" - "}
                                  {v.description}
                                </li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Escribe el mensaje aquí..."
                      className="min-h-[180px] font-mono text-sm"
                    />
                    <div className="flex flex-wrap gap-1">
                      {VARIABLES.map((v) => (
                        <Button
                          key={v.name}
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => insertVariable(v.name)}
                        >
                          {v.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={isCreating ? handleCreate : handleUpdate}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isCreating ? "Crear plantilla" : "Guardar cambios"}
                  </Button>
                </div>
              </>
            )}

            {!isCreating && !editingTemplate && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-center">
                  Selecciona una plantilla para editarla
                  <br />o crea una nueva.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};