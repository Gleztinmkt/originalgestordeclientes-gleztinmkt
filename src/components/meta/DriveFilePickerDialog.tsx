import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Folder, FileImage, FileVideo, ChevronLeft, Search, Users, Home, X, Check } from "lucide-react";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { toast } from "@/hooks/use-toast";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  iconLink?: string;
  modifiedTime?: string;
}

interface DriveListResp {
  files: DriveFile[];
  nextPageToken?: string;
  error?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSelect: (files: DriveFile[]) => void | Promise<void>;
  busy?: boolean;
  /** Permite elegir varios (carrusel). Default false. */
  multiple?: boolean;
}

const FOLDER = "application/vnd.google-apps.folder";

export const DriveFilePickerDialog = ({ open, onOpenChange, onSelect, busy = false, multiple = false }: Props) => {
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [stack, setStack] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "Mi unidad" }]);
  const [sharedMode, setSharedMode] = useState(false);
  const [selected, setSelected] = useState<DriveFile[]>([]);

  const current = stack[stack.length - 1];
  const isInsideFolder = stack.length > 1;

  // Cuando cambia carpeta o modo compartido, limpiamos búsqueda y selección.
  useEffect(() => {
    setSearchInput("");
    setAppliedSearch("");
    setSelected([]);
  }, [current.id, sharedMode]);

  const load = async () => {
    setLoading(true);
    try {
      // Si estamos dentro de una carpeta, NO usamos search del lado servidor:
      // pedimos todos los hijos y filtramos en cliente. Así no se "ocultan" archivos
      // que no contienen la palabra que buscamos para entrar a la carpeta.
      const useServerSearch = !isInsideFolder && appliedSearch.trim().length > 0;
      const r = await invokeEdgeFunction<DriveListResp>("drive-list-files", {
        folderId: current.id,
        sharedWithMe: sharedMode && !isInsideFolder,
        search: useServerSearch ? appliedSearch.trim() : undefined,
      });
      if (r?.error) throw new Error(r.error);
      setFiles(r.files || []);
    } catch (e: any) {
      toast({ title: "Error cargando Drive", description: e.message || String(e), variant: "destructive" });
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stack, sharedMode, appliedSearch]);

  const enterFolder = (f: DriveFile) => setStack((s) => [...s, { id: f.id, name: f.name }]);
  const goBack = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const goRoot = (mode: "mine" | "shared") => {
    setSharedMode(mode === "shared");
    setStack([{ id: null, name: mode === "shared" ? "Compartido conmigo" : "Mi unidad" }]);
  };

  const isBusy = busy || selecting;

  const triggerSelect = async (items: DriveFile[]) => {
    if (isBusy || items.length === 0) return;
    setSelecting(true);
    try {
      await onSelect(items);
      onOpenChange(false);
    } finally {
      setSelecting(false);
    }
  };

  const toggleSelect = (f: DriveFile) => {
    if (multiple) {
      setSelected((arr) => arr.find((x) => x.id === f.id) ? arr.filter((x) => x.id !== f.id) : [...arr, f]);
    } else {
      setSelected([f]);
    }
  };

  const handleConfirm = () => triggerSelect(selected);

  // Filtro local cuando estamos dentro de una carpeta.
  const visibleFiles = useMemo(() => {
    if (!isInsideFolder) return files;
    const q = searchInput.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, searchInput, isInsideFolder]);

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (isInsideFolder) {
      // dentro de carpeta el filtrado es local en vivo, Enter no hace nada
      return;
    }
    setAppliedSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    if (!isInsideFolder) setAppliedSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={isBusy ? () => undefined : onOpenChange} preventAutoClose>
      <DialogContent
        className="sm:max-w-[760px] max-h-[85vh] flex flex-col"
        preventAutoClose
      >
        <DialogHeader>
          <DialogTitle>Elegir archivo de Google Drive</DialogTitle>
          <DialogDescription>
            {multiple
              ? "Seleccioná hasta 10 imágenes/videos para el carrusel (JPG, PNG, MP4)."
              : "Solo se muestran JPG, PNG y MP4 compatibles con Meta."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 items-center flex-wrap">
          <Button type="button" size="sm" variant={!sharedMode ? "default" : "outline"} onClick={() => goRoot("mine")} className="gap-1">
            <Home className="h-3 w-3" /> Mi unidad
          </Button>
          <Button type="button" size="sm" variant={sharedMode ? "default" : "outline"} onClick={() => goRoot("shared")} className="gap-1">
            <Users className="h-3 w-3" /> Compartidos conmigo
          </Button>
        </div>

        <div className="flex gap-2 items-center text-xs text-muted-foreground">
          {isInsideFolder && (
            <Button type="button" size="sm" variant="ghost" onClick={goBack} className="h-7 px-2">
              <ChevronLeft className="h-4 w-4" /> Atrás
            </Button>
          )}
          <div className="truncate flex-1">
            📁 {stack.map((s) => s.name).join(" / ")}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isInsideFolder ? "Filtrar archivos en esta carpeta..." : "Buscar en todo Drive (Enter)..."}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKey}
              className="pl-7 pr-7 text-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {!isInsideFolder && (
            <Button type="button" size="sm" onClick={() => setAppliedSearch(searchInput.trim())} disabled={loading}>
              Buscar
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md min-h-[320px]">
          {loading ? (
            <div className="flex items-center justify-center h-full p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : visibleFiles.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground p-8">
              {isInsideFolder && searchInput
                ? `No hay archivos que contengan "${searchInput}" en esta carpeta.`
                : "Sin archivos en esta ubicación."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2">
              {visibleFiles.map((f) => {
                const isFolder = f.mimeType === FOLDER;
                const isVideo = f.mimeType === "video/mp4";
                const isImage = f.mimeType.startsWith("image/");
                const isSelected = !!selected.find((x) => x.id === f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => (isFolder ? enterFolder(f) : toggleSelect(f))}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      if (isFolder) enterFolder(f);
                      else triggerSelect([f]);
                    }}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-md border text-xs hover:bg-muted transition ${
                      isSelected ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-border"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <div className="w-full aspect-square bg-muted rounded flex items-center justify-center overflow-hidden">
                      {isFolder ? (
                        <Folder className="h-10 w-10 text-amber-500" />
                      ) : f.thumbnailLink ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.thumbnailLink} alt={f.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : isVideo ? (
                        <FileVideo className="h-10 w-10 text-blue-500" />
                      ) : isImage ? (
                        <FileImage className="h-10 w-10 text-emerald-500" />
                      ) : (
                        <FileImage className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="w-full truncate text-center" title={f.name}>{f.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {isFolder ? "Carpeta" : f.mimeType.split("/")[1]?.toUpperCase()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-2 border-t gap-2">
          <div className="text-xs text-muted-foreground truncate flex-1">
            {selected.length > 0
              ? <>Seleccionado{selected.length > 1 ? `s (${selected.length})` : ""}: <span className="font-medium">{selected.map(s => s.name).join(", ")}</span></>
              : multiple ? "Tocá uno o más archivos." : "Doble click para seleccionar rápido."}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>Cancelar</Button>
            <Button type="button" onClick={handleConfirm} disabled={selected.length === 0 || isBusy}>
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isBusy ? "Cargando..." : multiple && selected.length > 1 ? `Usar ${selected.length} archivos` : "Seleccionar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
