import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Folder, FileImage, FileVideo, ChevronLeft, Search, Users, Home, X, Check, Zap } from "lucide-react";
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
  parents?: string[];
}

interface DriveListResp {
  files: DriveFile[];
  nextPageToken?: string;
  error?: string;
}

interface Suggestion {
  /** Carpeta sugerida (modo carpeta). */
  folder?: DriveFile;
  /** Archivo sugerido (modo archivo, click directo selecciona). */
  file?: DriveFile;
  parentId: string;
  parentName: string;
  /** Si está presente, este botón es la "carpeta del día" (post finalizados/mes/día). */
  dateLabel?: string;
  /** Etiqueta para sugerencias por título de publicación. */
  titleLabel?: string;
  /** Stack a usar al click para navegar derecho hasta esta carpeta. */
  navStack?: { id: string | null; name: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSelect: (files: DriveFile[]) => void | Promise<void>;
  busy?: boolean;
  /** Permite elegir varios (carrusel). Default false. */
  multiple?: boolean;
  /** Nombre del cliente para sugerir carpeta recomendada. */
  clientName?: string;
  /** Nombre de la publicación (para futuras sugerencias por título). */
  publicationName?: string;
  /** Fecha ISO de la publicación (para sugerir post finalizados/mes/día). */
  publicationDate?: string;
}

const FOLDER = "application/vnd.google-apps.folder";

export const DriveFilePickerDialog = ({ open, onOpenChange, onSelect, busy = false, multiple = false, clientName, publicationName, publicationDate }: Props) => {
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [stack, setStack] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "Mi unidad" }]);
  const [sharedMode, setSharedMode] = useState(false);
  const [selected, setSelected] = useState<DriveFile[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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

  const findSuggestions = async () => {
    if (!clientName) return;
    setLoadingSuggestions(true);
    try {
      const matResp = await invokeEdgeFunction<DriveListResp>("drive-list-files", {
        search: "Material Clientes",
      });
      const matFolders = (matResp?.files || []).filter(
        (f) => f.mimeType === FOLDER && f.name.toLowerCase().trim() === "material clientes"
      );

      const months = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
      ];
      let pubDateInfo: { monthName: string; day: string; pretty: string } | null = null;
      if (publicationDate) {
        const d = new Date(publicationDate);
        if (!isNaN(d.getTime())) {
          pubDateInfo = {
            monthName: months[d.getMonth()],
            day: String(d.getDate()),
            pretty: `${months[d.getMonth()]} ${d.getDate()}`,
          };
        }
      }

      const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
      const listChildren = async (parentId: string, search?: string): Promise<DriveFile[]> => {
        const r = await invokeEdgeFunction<DriveListResp>("drive-list-files", {
          folderId: parentId,
          ...(search ? { search } : {}),
        });
        return r?.files || [];
      };
      // Busca subcarpetas que matcheen ALGUNA de las keywords (contiene)
      const findFolderByKeywords = async (parentId: string, keywords: string[]): Promise<DriveFile[]> => {
        const all = await listChildren(parentId);
        const folders = all.filter((f) => f.mimeType === FOLDER);
        const kws = keywords.map(norm);
        const matches = folders.filter((f) => {
          const n = norm(f.name);
          return kws.some((k) => n.includes(k));
        });
        // Priorizar las que contengan más keywords
        matches.sort((a, b) => {
          const score = (x: DriveFile) => kws.reduce((acc, k) => acc + (norm(x.name).includes(k) ? 1 : 0), 0);
          return score(b) - score(a);
        });
        return matches;
      };
      const findChildExact = async (parentId: string, name: string): Promise<DriveFile | null> => {
        const r = await listChildren(parentId, name);
        const target = norm(name);
        return (
          r.find((f) => f.mimeType === FOLDER && norm(f.name) === target) ||
          r.find((f) => f.mimeType === FOLDER && norm(f.name).includes(target)) ||
          null
        );
      };

      const allSuggestions: Suggestion[] = [];
      const seen = new Set<string>();
      for (const mat of matFolders) {
        const clientResp = await invokeEdgeFunction<DriveListResp>("drive-list-files", {
          folderId: mat.id,
          search: clientName,
        });
        const clientFolders = (clientResp?.files || []).filter((f) => f.mimeType === FOLDER);
        for (const cf of clientFolders) {
          if (!seen.has(cf.id)) {
            seen.add(cf.id);
            allSuggestions.push({ folder: cf, parentId: mat.id, parentName: mat.name });
          }

          // ---- Sugerencias de ARCHIVOS por título de publicación ----
          // BFS limitada dentro de la carpeta del cliente buscando archivos cuyo nombre
          // contenga el título (o palabras clave del título).
          if (publicationName && publicationName.trim().length > 0) {
            try {
              const cleanTitle = publicationName
                .toLowerCase()
                .replace(/\(.*?\)/g, " ")
                .replace(/[^\p{L}\p{N}\s]/gu, " ")
                .replace(/\s+/g, " ")
                .trim();
              const stop = new Set(["de","la","el","los","las","y","o","u","del","en","con","para","por","a","un","una","al","mi","tu"]);
              const tokens = cleanTitle
                .split(" ")
                .filter((w) => w.length >= 4 && !stop.has(w))
                .slice(0, 3);
              const queries = Array.from(new Set([cleanTitle, ...tokens])).filter(Boolean);

              // Carpetas a inspeccionar: cliente + sus subcarpetas finalizad/post/reel/video y un nivel más.
              const visitFolders: { folder: DriveFile; parents: { id: string; name: string }[] }[] = [];
              const cfParents = [
                { id: null as any, name: "Mi unidad" },
                { id: mat.id, name: mat.name },
              ];
              visitFolders.push({ folder: cf, parents: cfParents });
              const subs = await findFolderByKeywords(cf.id, ["finalizad", "post", "reel", "video"]);
              for (const sf of subs.slice(0, 5)) {
                visitFolders.push({ folder: sf, parents: [...cfParents, { id: cf.id, name: cf.name }] });
                // Un nivel más (ej. mes)
                try {
                  const grand = (await listChildren(sf.id)).filter((x) => x.mimeType === FOLDER).slice(0, 12);
                  for (const gf of grand) {
                    visitFolders.push({ folder: gf, parents: [...cfParents, { id: cf.id, name: cf.name }, { id: sf.id, name: sf.name }] });
                  }
                } catch {}
              }

              const titleNorm = norm(cleanTitle);
              const fileMatches: { file: DriveFile; parents: { id: string; name: string }[]; folder: DriveFile }[] = [];
              for (const v of visitFolders.slice(0, 40)) {
                for (const q of queries.slice(0, 3)) {
                  let children: DriveFile[] = [];
                  try { children = await listChildren(v.folder.id, q); } catch { continue; }
                  for (const ch of children) {
                    if (ch.mimeType === FOLDER) continue;
                    const nName = norm(ch.name).replace(/\.[a-z0-9]+$/i, "");
                    const matchesFull = titleNorm && nName.includes(titleNorm);
                    const matchesAnyToken = tokens.some((t) => nName.includes(t));
                    if (matchesFull || matchesAnyToken) {
                      if (!seen.has(ch.id)) {
                        seen.add(ch.id);
                        fileMatches.push({ file: ch, parents: v.parents, folder: v.folder });
                      }
                    }
                  }
                  if (fileMatches.length >= 6) break;
                }
                if (fileMatches.length >= 6) break;
              }

              for (const fm of fileMatches.slice(0, 6)) {
                allSuggestions.push({
                  file: fm.file,
                  parentId: fm.folder.id,
                  parentName: fm.folder.name,
                  titleLabel: fm.file.name,
                  navStack: [...fm.parents, { id: fm.folder.id, name: fm.folder.name }],
                });
              }
            } catch {
              // ignorar errores de búsqueda por título
            }
          }

          if (!pubDateInfo) continue;

          // Buscar subcarpetas "finalizadas" dentro del cliente: post, reels, videos, finalizados...
          try {
            const finalizadasFolders = await findFolderByKeywords(cf.id, [
              "finalizad", // matchea finalizados/finalizadas
              "post",
              "reel",
              "video",
            ]);
            // Dedupe by id
            const uniqFinal = Array.from(new Map(finalizadasFolders.map((f) => [f.id, f])).values());

            for (const finalFolder of uniqFinal.slice(0, 4)) {
              const monthFolder = await findChildExact(finalFolder.id, pubDateInfo.monthName);
              if (!monthFolder) continue;
              const dayFolder = await findChildExact(monthFolder.id, pubDateInfo.day);
              if (!dayFolder) continue;
              if (seen.has(dayFolder.id)) continue;
              seen.add(dayFolder.id);
              allSuggestions.push({
                folder: dayFolder,
                parentId: monthFolder.id,
                parentName: monthFolder.name,
                dateLabel: `${pubDateInfo.pretty} · ${finalFolder.name}`,
                navStack: [
                  { id: null, name: "Mi unidad" },
                  { id: mat.id, name: mat.name },
                  { id: cf.id, name: cf.name },
                  { id: finalFolder.id, name: finalFolder.name },
                  { id: monthFolder.id, name: monthFolder.name },
                  { id: dayFolder.id, name: dayFolder.name },
                ],
              });
            }
          } catch {
            // ignorar
          }
        }
      }
      setSuggestions(allSuggestions);
    } catch {
      // Silencioso: es un extra de conveniencia
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (open) {
      load();
      findSuggestions();
    }
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
      return;
    }
    setAppliedSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    if (!isInsideFolder) setAppliedSearch("");
  };

  const navigateToSuggestion = (s: Suggestion) => {
    setSharedMode(false);
    if (s.navStack && s.navStack.length > 0) {
      setStack(s.navStack);
      return;
    }
    if (s.folder) {
      setStack([
        { id: null, name: "Mi unidad" },
        { id: s.parentId, name: s.parentName },
        { id: s.folder.id, name: s.folder.name },
      ]);
    }
  };

  const handleSuggestionClick = (s: Suggestion) => {
    if (s.file) {
      // Selección directa del archivo recomendado
      triggerSelect([s.file]);
      return;
    }
    navigateToSuggestion(s);
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

        {clientName && (
          <div className="space-y-1.5 rounded-md border bg-muted/30 p-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              Recomendado para <span className="font-semibold">{clientName}</span>
            </div>
            {loadingSuggestions ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Buscando carpeta…
              </div>
            ) : suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => {
                  const isFile = !!s.file;
                  const key = (isFile ? "file-" : s.dateLabel ? "date-" : "client-") + (s.file?.id || s.folder?.id);
                  return (
                    <Button
                      key={key}
                      type="button"
                      size="sm"
                      variant={isFile ? "default" : s.dateLabel ? "default" : "outline"}
                      className="h-auto py-1.5 px-2.5 text-xs gap-1.5 justify-start"
                      onClick={() => handleSuggestionClick(s)}
                      disabled={isBusy}
                    >
                      {isFile ? (
                        s.file?.mimeType === "video/mp4" ? (
                          <FileVideo className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <FileImage className="h-3.5 w-3.5 shrink-0" />
                        )
                      ) : (
                        <Folder className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {isFile ? (
                        <span className="truncate max-w-[260px]">
                          Usar <span className="font-semibold">{s.titleLabel || s.file?.name}</span>
                        </span>
                      ) : s.dateLabel ? (
                        <span className="truncate max-w-[260px]">
                          Contenido del <span className="font-semibold">{s.dateLabel}</span>
                        </span>
                      ) : (
                        <span className="truncate max-w-[200px]">{s.parentName} / <span className="font-medium">{s.folder?.name}</span></span>
                      )}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                No se encontró carpeta recomendada en <span className="font-medium">Material Clientes</span>.
              </div>
            )}
          </div>
        )}

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
