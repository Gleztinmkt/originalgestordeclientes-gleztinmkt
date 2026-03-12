import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, ListChecks } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Publication {
  id: string;
  name: string;
  date: string;
  type: string;
  is_published: boolean;
  status: string | null;
}

interface PublicationPickerDialogProps {
  clientId: string;
  packageId: string;
  onPublicationsUpdated: (newUsedCount: number) => void;
  disabled?: boolean;
}

const typeLabels: Record<string, string> = {
  reel: "Reel",
  carousel: "Carrusel",
  image: "Imagen",
};

const typeBadgeVariant: Record<string, string> = {
  reel: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  carousel: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  image: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export const PublicationPickerDialog = ({
  clientId,
  packageId,
  onPublicationsUpdated,
  disabled,
}: PublicationPickerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchPublications = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("publications")
          .select("id, name, date, type, is_published, status")
          .eq("client_id", clientId)
          .eq("package_id", packageId)
          .is("deleted_at", null)
          .order("date", { ascending: true });

        if (error) throw error;
        setPublications(data || []);
        // Pre-select already published ones
        const alreadyPublished = new Set(
          (data || []).filter((p) => p.is_published).map((p) => p.id)
        );
        setSelectedIds(alreadyPublished);
      } catch (error) {
        console.error("Error fetching publications:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las publicaciones.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPublications();
  }, [open, clientId, packageId]);

  const togglePublication = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update all publications: mark selected as published, unmark others
      const updates = publications.map((pub) => {
        const shouldBePublished = selectedIds.has(pub.id);
        return supabase
          .from("publications")
          .update({ is_published: shouldBePublished })
          .eq("id", pub.id);
      });

      const results = await Promise.all(updates);
      const hasError = results.some((r) => r.error);
      if (hasError) throw new Error("Error updating some publications");

      const newUsedCount = selectedIds.size;
      onPublicationsUpdated(newUsedCount);

      toast({
        title: "Publicaciones actualizadas",
        description: `${selectedIds.size} publicación(es) marcada(s) como subida(s).`,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error saving publications:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar las publicaciones.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const publishedCount = selectedIds.size;
  const totalCount = publications.length;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="gap-2"
      >
        <ListChecks className="h-4 w-4" />
        Elegir publicación
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Elegir publicaciones a marcar como subidas
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {publishedCount} de {totalCount} seleccionadas
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-1 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : publications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay publicaciones en este paquete.
              </p>
            ) : (
              publications.map((pub) => {
                const isSelected = selectedIds.has(pub.id);
                const pubDate = new Date(pub.date);
                return (
                  <div
                    key={pub.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                      isSelected ? "bg-accent/30" : ""
                    }`}
                    onClick={() => togglePublication(pub.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => togglePublication(pub.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${isSelected ? "text-primary" : ""}`}>
                        {pub.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(pubDate, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs shrink-0 ${
                        typeBadgeVariant[pub.type] || typeBadgeVariant.image
                      }`}
                      variant="secondary"
                    >
                      {typeLabels[pub.type] || pub.type}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
