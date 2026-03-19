import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FolderOpen, Loader2 } from "lucide-react";
import { Publication } from "./types";

interface DriveFolderSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publications: Publication[];
  onGenerate: (selectedIds: string[]) => Promise<void>;
}

export const DriveFolderSelectionDialog = ({
  open,
  onOpenChange,
  publications,
  onGenerate,
}: DriveFolderSelectionDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(publications.map((p) => p.id))
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleAll = () => {
    if (selectedIds.size === publications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(publications.map((p) => p.id)));
    }
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedIds.size === 0) return;
    setIsGenerating(true);
    try {
      await onGenerate(Array.from(selectedIds));
      onOpenChange(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const allSelected = selectedIds.size === publications.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[70vh] flex flex-col dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Generar carpetas en Drive
          </DialogTitle>
          <DialogDescription>
            Seleccioná las publicaciones para las que querés crear carpetas en Drive.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1 py-2">
          {/* Select all */}
          <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 cursor-pointer font-medium text-sm border-b border-border mb-1">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              disabled={isGenerating}
            />
            <span>Seleccionar todas ({publications.length})</span>
          </label>

          {publications.map((pub) => (
            <label
              key={pub.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 cursor-pointer text-sm"
            >
              <Checkbox
                checked={selectedIds.has(pub.id)}
                onCheckedChange={() => toggle(pub.id)}
                disabled={isGenerating}
              />
              <div className="flex-1 min-w-0">
                <span className="block truncate">{pub.name}</span>
                <span className="text-xs text-muted-foreground">
                  {pub.type} · {new Date(pub.date).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </label>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || selectedIds.size === 0}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FolderOpen className="h-4 w-4 mr-2" />
                {selectedIds.size === publications.length
                  ? "Generar todas"
                  : `Generar ${selectedIds.size} carpeta${selectedIds.size !== 1 ? "s" : ""}`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
