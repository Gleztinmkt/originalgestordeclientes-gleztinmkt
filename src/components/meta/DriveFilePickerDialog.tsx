import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Folder, FileImage, FileVideo, ChevronLeft, Search, Users } from "lucide-react";
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
  onSelect: (file: DriveFile) => void | Promise<void>;
  busy?: boolean;
}

const FOLDER = "application/vnd.google-apps.folder";

export const DriveFilePickerDialog = ({ open, onOpenChange, onSelect, busy = false }: Props) => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [search, setSearch] = useState("");
  const [stack, setStack] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "Mi unidad" }]);
  const [sharedMode, setSharedMode] = useState(false);
  const [selected, setSelected] = useState<DriveFile | null>(null);

  const current = stack[stack.length - 1];

  const load = async () => {
    setLoading(true);
    setSelected(null);
    try {
      const r = await invokeEdgeFunction<DriveListResp>("drive-list-files", {
        folderId: current.id,
        sharedWithMe: sharedMode && stack.length === 1,
        search: search.trim() || undefined,
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
  }, [open, stack, sharedMode]);

  const enterFolder = (f: DriveFile) => setStack((s) => [...s, { id: f.id, name: f.name }]);
  const goBack = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const goRoot = (mode: "mine" | "shared") => {
    setSharedMode(mode === "shared");
    setStack([{ id: null, name: mode === "shared" ? "Compartido conmigo" : "Mi unidad" }]);
  };

  const pickFile = (file: DriveFile) => {
    if (busy) return;
    onSelect(file);
    onOpenChange(false);
  };

  const handlePick = () => {
    if (!selected) return;
    pickFile(selected);
  };

  return (
    <Dialog open={open} onOpenChange={busy ? () => undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[80vh] flex flex-col" onEscapeKeyDown={(e) => busy && e.preventDefault()} onPointerDownOutside={(e) => busy && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Elegir archivo de Google Drive</DialogTitle>
          <DialogDescription>Solo se muestran JPG, PNG y MP4 compatibles con Meta.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 items-center">
          <Button type="button" size="sm" variant={!sharedMode ? "default" : "outline"} onClick={() => goRoot("mine")}>
            Mi unidad
          </Button>
          <Button type="button" size="sm" variant={sharedMode ? "default" : "outline"} onClick={() => goRoot("shared")} className="gap-1">
            <Users className="h-3 w-3" /> Compartidos
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          {stack.length > 1 && (
            <Button type="button" size="sm" variant="ghost" onClick={goBack}><ChevronLeft className="h-4 w-4" /></Button>
          )}
          <div className="text-xs text-muted-foreground truncate flex-1">
            {stack.map((s) => s.name).join(" / ")}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="pl-7 text-sm"
            />
          </div>
          <Button type="button" size="sm" onClick={load} disabled={loading}>Buscar</Button>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground p-8">Sin archivos en esta carpeta.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2">
              {files.map((f) => {
                const isFolder = f.mimeType === FOLDER;
                const isVideo = f.mimeType === "video/mp4";
                const isImage = f.mimeType.startsWith("image/");
                const isSelected = selected?.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => (isFolder ? enterFolder(f) : setSelected(f))}
                    onDoubleClick={() => {
                      if (isFolder) enterFolder(f);
                      else pickFile(f);
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-md border text-xs hover:bg-muted transition ${
                      isSelected ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <div className="w-full aspect-square bg-muted rounded flex items-center justify-center overflow-hidden">
                      {isFolder ? (
                        <Folder className="h-10 w-10 text-muted-foreground" />
                      ) : f.thumbnailLink ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.thumbnailLink} alt={f.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : isVideo ? (
                        <FileVideo className="h-10 w-10 text-muted-foreground" />
                      ) : isImage ? (
                        <FileImage className="h-10 w-10 text-muted-foreground" />
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

        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-xs text-muted-foreground truncate flex-1">
            {selected ? <>Seleccionado: <span className="font-medium">{selected.name}</span></> : "Hacé doble click o seleccioná y confirmá."}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
            <Button type="button" onClick={handlePick} disabled={!selected || busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Seleccionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
