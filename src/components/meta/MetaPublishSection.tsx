import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Send, Calendar as CalendarIcon, RefreshCw, Instagram, Facebook,
  AlertCircle, Link2, FolderOpen, FileImage, FileVideo, ExternalLink,
  Trash2, CheckCircle2, ListChecks, Images,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { toast } from "@/hooks/use-toast";
import { Publication } from "../client/publication/types";
import { MetaConnectionButton } from "./MetaConnectionButton";
import { DriveFilePickerDialog, DriveFile } from "./DriveFilePickerDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MetaPublishSectionProps {
  publication: Publication;
  clientId: string;
  clientName: string;
  copywriting: string;
  onPublishedInCrm?: () => void;
}

interface SocialConnection {
  status: string;
  facebook_page_id: string | null;
  facebook_page_name: string | null;
  instagram_business_account_id: string | null;
  instagram_username: string | null;
}

interface MediaItem {
  drive_file_id: string;
  drive_file_name: string;
  drive_file_mime_type: string;
  drive_file_size: number;
  media_url: string;
  media_storage_path: string;
}

interface PubMeta {
  drive_file_id?: string | null;
  drive_file_url?: string | null;
  drive_file_name?: string | null;
  drive_file_mime_type?: string | null;
  drive_file_size?: number | null;
  media_url?: string | null;
  media_storage_path?: string | null;
  media_items?: MediaItem[] | null;
  publish_status?: string | null;
  publish_error?: string | null;
  meta_caption?: string | null;
  publish_to_instagram?: boolean | null;
  publish_to_facebook?: boolean | null;
  scheduled_publish_at?: string | null;
  auto_publish_enabled?: boolean | null;
  instagram_media_id?: string | null;
  facebook_post_id?: string | null;
  cover_thumb_offset?: number | null;
}

interface ScheduledRow {
  id: string;
  name: string;
  scheduled_publish_at: string;
  publish_status: string;
}

const ALLOWED = ["image/jpeg", "image/png", "video/mp4"];

export const MetaPublishSection = ({
  publication, clientId, clientName, copywriting, onPublishedInCrm,
}: MetaPublishSectionProps) => {
  const [connection, setConnection] = useState<SocialConnection | null>(null);
  const [meta, setMeta] = useState<PubMeta>({});
  const [caption, setCaption] = useState(copywriting || "");
  const [toIG, setToIG] = useState(true);
  const [toFB, setToFB] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMultiple, setPickerMultiple] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [scheduledList, setScheduledList] = useState<ScheduledRow[]>([]);
  const [showScheduled, setShowScheduled] = useState(false);
  const [coverOffset, setCoverOffset] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const items: MediaItem[] = useMemo(() => {
    if (Array.isArray(meta.media_items) && meta.media_items.length > 0) return meta.media_items;
    if (meta.media_url && meta.drive_file_id) {
      return [{
        drive_file_id: meta.drive_file_id,
        drive_file_name: meta.drive_file_name || "Archivo",
        drive_file_mime_type: meta.drive_file_mime_type || "",
        drive_file_size: meta.drive_file_size || 0,
        media_url: meta.media_url,
        media_storage_path: meta.media_storage_path || "",
      }];
    }
    return [];
  }, [meta]);

  const refresh = async () => {
    const [{ data: conn }, { data: pub }] = await Promise.all([
      (supabase as any).from("social_connections").select("*").eq("client_id", clientId).maybeSingle(),
      (supabase as any).from("publications")
        .select("drive_file_id,drive_file_url,drive_file_name,drive_file_mime_type,drive_file_size,media_url,media_storage_path,media_items,publish_status,publish_error,meta_caption,publish_to_instagram,publish_to_facebook,scheduled_publish_at,auto_publish_enabled,instagram_media_id,facebook_post_id,cover_thumb_offset")
        .eq("id", publication.id).maybeSingle(),
    ]);
    setConnection(conn || null);
    if (pub) {
      setMeta(pub);
      setCaption(pub.meta_caption || copywriting || "");
      if (typeof pub.publish_to_instagram === "boolean") setToIG(pub.publish_to_instagram);
      if (typeof pub.publish_to_facebook === "boolean") setToFB(pub.publish_to_facebook);
      if (pub.scheduled_publish_at) setScheduleAt(pub.scheduled_publish_at.slice(0, 16));
      setCoverOffset(typeof pub.cover_thumb_offset === "number" ? String(pub.cover_thumb_offset) : "");
    }
  };

  const loadScheduled = async () => {
    const { data } = await (supabase as any)
      .from("publications")
      .select("id,name,scheduled_publish_at,publish_status")
      .eq("client_id", clientId)
      .eq("publish_status", "scheduled")
      .not("scheduled_publish_at", "is", null)
      .order("scheduled_publish_at", { ascending: true });
    setScheduledList(data || []);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publication.id, clientId]);

  useEffect(() => {
    if (showScheduled) loadScheduled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showScheduled]);

  const isConnected = connection?.status === "connected";

  const persistMeta = async (patch: Partial<PubMeta>) => {
    const { error } = await (supabase as any).from("publications").update(patch).eq("id", publication.id);
    if (error) throw error;
  };

  // Simulación realista de progreso para preparación (servidor no emite eventos)
  const runWithProgress = async <T,>(label: string, target: number, fn: () => Promise<T>): Promise<T> => {
    setProgress(2);
    setProgressLabel(label);
    let p = 2;
    const tick = setInterval(() => {
      p = Math.min(target, p + Math.max(1, Math.round((target - p) * 0.08)));
      setProgress(p);
    }, 250);
    try {
      const result = await fn();
      clearInterval(tick);
      setProgress(target);
      return result;
    } catch (e) {
      clearInterval(tick);
      throw e;
    }
  };

  const handleDrivePick = async (picked: DriveFile[]) => {
    const invalid = picked.filter((f) => !ALLOWED.includes(f.mimeType));
    if (invalid.length > 0) {
      toast({ title: "Formato no compatible", description: `${invalid.map(f => f.name).join(", ")}: usá JPG, PNG o MP4.`, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await persistMeta({ publish_status: "preparing", publish_error: null } as any);
      await refresh();
      const r = await runWithProgress("Descargando de Drive y subiendo a Storage…", 95, () =>
        invokeEdgeFunction<any>("prepare-drive-media-batch", {
          publication_id: publication.id,
          files: picked.map((f) => ({ id: f.id, name: f.name })),
        }),
      );
      if (r?.error) throw new Error(r.error);
      setProgress(100);
      setProgressLabel("Archivo listo");
      toast({ title: picked.length > 1 ? `${picked.length} archivos listos` : "Archivo listo" });
      await refresh();
    } catch (e: any) {
      await persistMeta({ publish_status: "failed", publish_error: e.message || String(e) } as any).catch(() => null);
      toast({ title: "Error preparando archivo", description: e.message || String(e), variant: "destructive" });
    } finally {
      setBusy(false);
      setTimeout(() => { setProgress(0); setProgressLabel(""); }, 1200);
    }
  };

  const handleRemoveFile = async () => {
    setBusy(true);
    try {
      await persistMeta({
        drive_file_id: null, drive_file_url: null, drive_file_name: null,
        drive_file_mime_type: null, drive_file_size: null,
        media_url: null, media_storage_path: null, media_items: [],
        scheduled_publish_at: null, auto_publish_enabled: false,
        publish_status: "draft", publish_error: null,
      } as any);
      toast({ title: "Archivo eliminado" });
      await refresh();
    } catch (e: any) {
      toast({ title: "Error eliminando", description: e.message || String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handlePublishNow = async () => {
    if (!isConnected) return toast({ title: "Conectá Meta primero", variant: "destructive" });
    if (items.length === 0) return toast({ title: "Preparar archivo primero", variant: "destructive" });
    if (!toIG && !toFB) return toast({ title: "Elegí al menos una plataforma", variant: "destructive" });

    setBusy(true);
    try {
      await persistMeta({ meta_caption: caption, publish_to_instagram: toIG, publish_to_facebook: toFB });
      const r = await runWithProgress("Publicando en Meta…", 90, () =>
        invokeEdgeFunction<any>("meta-publish-now", { publication_id: publication.id }),
      );
      if (r?.error) throw new Error(r.error);
      setProgress(100);
      setProgressLabel("Post subido");
      toast({ title: "Post subido a Meta ✅" });
      await refresh();
    } catch (e: any) {
      toast({ title: "Error al publicar", description: e.message || String(e), variant: "destructive" });
      await refresh();
    } finally {
      setBusy(false);
      setTimeout(() => { setProgress(0); setProgressLabel(""); }, 1500);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleAt) return toast({ title: "Elegí fecha y hora", variant: "destructive" });
    if (items.length === 0) return toast({ title: "Preparar archivo primero", variant: "destructive" });
    const when = new Date(scheduleAt);
    if (when.getTime() < Date.now() + 60_000) {
      return toast({ title: "La fecha debe ser al menos en 1 minuto", variant: "destructive" });
    }
    setBusy(true);
    try {
      await runWithProgress("Programando…", 95, async () => {
        await persistMeta({
          meta_caption: caption,
          publish_to_instagram: toIG,
          publish_to_facebook: toFB,
          scheduled_publish_at: when.toISOString(),
          auto_publish_enabled: true,
          publish_status: "scheduled",
          publish_error: null,
        } as any);
      });
      setProgress(100);
      setProgressLabel("Programada en CRM");
      toast({ title: "Programada", description: `Se publicará automáticamente el ${format(when, "PPpp", { locale: es })}` });
      await refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || String(e), variant: "destructive" });
    } finally {
      setBusy(false);
      setTimeout(() => { setProgress(0); setProgressLabel(""); }, 1500);
    }
  };

  const handleCancelSchedule = async () => {
    setBusy(true);
    try {
      await persistMeta({
        scheduled_publish_at: null,
        auto_publish_enabled: false,
        publish_status: "ready_to_publish",
      } as any);
      toast({ title: "Programación cancelada" });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async () => {
    setBusy(true);
    try {
      await invokeEdgeFunction("meta-retry-failed", { publication_id: publication.id });
      toast({ title: "Reintentando..." });
      await refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const status = meta.publish_status || "draft";
  const hasFile = items.length > 0;
  const isCarousel = items.length > 1;
  const firstItem = items[0];
  const isImage = firstItem?.drive_file_mime_type?.startsWith("image/");
  const isVideo = firstItem?.drive_file_mime_type?.startsWith("video/");
  const canMarkCrmPublished = (status === "published" || status === "scheduled") && !publication.is_published;

  const handleCrmPublishedClick = () => {
    if (confirm("¿Querés cambiar el estado a publicado y descontar esta publicación del paquete?")) {
      onPublishedInCrm?.();
    }
  };

  const statusBadge = (s: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      published: "default",
      scheduled: "outline",
      ready_to_publish: "secondary",
      preparing: "secondary",
      publishing: "secondary",
      failed: "destructive",
      draft: "secondary",
    };
    const labels: Record<string, string> = {
      published: "Publicado",
      scheduled: "Programado",
      ready_to_publish: "Listo",
      preparing: "Preparando",
      publishing: "Publicando",
      failed: "Falló",
      draft: "Borrador",
    };
    return <Badge variant={variants[s] || "secondary"}>{labels[s] || s}</Badge>;
  };

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Send className="h-4 w-4" />
          Publicación en redes
        </div>
        {statusBadge(status)}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={canMarkCrmPublished ? "default" : "secondary"}
          onClick={canMarkCrmPublished ? handleCrmPublishedClick : () => setExpanded((v) => !v)}
          disabled={busy}
          className="gap-2"
        >
          {canMarkCrmPublished ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          {canMarkCrmPublished
            ? (status === "scheduled" ? "Marcar publicado" : "Post subido")
            : (expanded ? "Ocultar opciones" : "Subir a Meta")}
        </Button>
        {canMarkCrmPublished && (
          <Button type="button" size="sm" variant="outline" onClick={() => setExpanded((v) => !v)} disabled={busy}>
            {expanded ? "Ocultar opciones" : "Opciones"}
          </Button>
        )}
      </div>

      {(busy || progress > 0) && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            {busy && <Loader2 className="h-3 w-3 animate-spin" />}
            {progressLabel || "Procesando…"} {progress > 0 && progress < 100 ? `(${progress}%)` : ""}
          </div>
        </div>
      )}

      {expanded && (
        <>
          {!isConnected ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Este cliente no tiene Instagram/Facebook conectado.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex gap-2 flex-wrap text-xs">
              {connection?.instagram_username && (
                <Badge variant="outline" className="gap-1"><Instagram className="h-3 w-3" /> @{connection.instagram_username}</Badge>
              )}
              {connection?.facebook_page_name && (
                <Badge variant="outline" className="gap-1"><Facebook className="h-3 w-3" /> {connection.facebook_page_name}</Badge>
              )}
            </div>
          )}

          <MetaConnectionButton clientId={clientId} clientName={clientName} compact />

          {/* File picker section */}
          <div className="space-y-2">
            <Label className="text-xs">Archivo{isCarousel ? "s (carrusel)" : ""}</Label>

            {hasFile ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 border rounded-md bg-background">
                  <div className="w-14 h-14 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {isCarousel ? (
                      <Images className="h-7 w-7 text-primary" />
                    ) : isImage && firstItem.media_url ? (
                      <img src={firstItem.media_url} alt="preview" className="w-full h-full object-cover" />
                    ) : isVideo ? (
                      <FileVideo className="h-7 w-7 text-muted-foreground" />
                    ) : (
                      <FileImage className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-xs space-y-0.5">
                    <div className="font-medium truncate">
                      {isCarousel ? `Carrusel · ${items.length} archivos` : firstItem.drive_file_name}
                    </div>
                    <div className="text-muted-foreground">
                      {isCarousel
                        ? items.map(i => i.drive_file_mime_type?.split("/")[1]?.toUpperCase()).join(" · ")
                        : (firstItem.drive_file_mime_type || "—")}
                    </div>
                    {firstItem.media_url && !isCarousel && (
                      <a href={firstItem.media_url} target="_blank" rel="noreferrer" className="text-blue-500 inline-flex items-center gap-1">
                        <Link2 className="h-3 w-3" /> Ver preparado
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button type="button" size="sm" variant="outline" onClick={() => { setPickerMultiple(publication.type === "carousel"); setPickerOpen(true); }} disabled={busy}>
                      Cambiar
                    </Button>
                    <Button type="button" size="sm" variant="destructive" onClick={handleRemoveFile} disabled={busy} className="gap-1">
                      <Trash2 className="h-3 w-3" /> Eliminar
                    </Button>
                  </div>
                </div>
                {isCarousel && (
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {items.map((it, idx) => (
                      <div key={it.drive_file_id + idx} className="w-16 h-16 shrink-0 rounded border bg-muted overflow-hidden flex items-center justify-center">
                        {it.drive_file_mime_type?.startsWith("image/") ? (
                          <img src={it.media_url} alt={it.drive_file_name} className="w-full h-full object-cover" />
                        ) : (
                          <FileVideo className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => { setPickerMultiple(false); setPickerOpen(true); }} disabled={busy} className="gap-2 flex-1">
                  <FolderOpen className="h-4 w-4" /> Elegir 1 archivo
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => { setPickerMultiple(true); setPickerOpen(true); }} disabled={busy} className="gap-2 flex-1">
                  <Images className="h-4 w-4" /> Carrusel (varios)
                </Button>
              </div>
            )}

            <div className="text-[11px] text-muted-foreground">
              Formatos: JPG, PNG, MP4. Carruseles hasta 10 archivos.
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Caption (Meta)</Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[80px] text-xs"
              placeholder="Copy a publicar en redes"
            />
          </div>

          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-2"><Checkbox checked={toIG} onCheckedChange={(c) => setToIG(!!c)} /> Instagram</label>
            <label className="flex items-center gap-2"><Checkbox checked={toFB} onCheckedChange={(c) => setToFB(!!c)} /> Facebook</label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handlePublishNow} disabled={busy || !isConnected || !hasFile} className="gap-1">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publicar ahora
            </Button>
            {status === "failed" && (
              <Button type="button" size="sm" variant="outline" onClick={handleRetry} disabled={busy} className="gap-1">
                <RefreshCw className="h-4 w-4" /> Reintentar
              </Button>
            )}
          </div>

          {/* Programación interna en CRM */}
          <div className="space-y-1 pt-2 border-t">
            <Label className="text-xs flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" /> Programar (auto en CRM)
            </Label>
            <div className="flex gap-2">
              <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="text-xs" />
              <Button type="button" size="sm" variant="outline" onClick={handleSchedule} disabled={busy || !hasFile}>
                Programar
              </Button>
              {meta.scheduled_publish_at && (
                <Button type="button" size="sm" variant="ghost" onClick={handleCancelSchedule} disabled={busy} className="text-destructive">
                  Cancelar
                </Button>
              )}
            </div>
            {meta.scheduled_publish_at && (
              <div className="text-[11px] text-muted-foreground">
                Programada para: {format(new Date(meta.scheduled_publish_at), "PPpp", { locale: es })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowScheduled((v) => !v)}
              className="text-[11px] text-primary underline inline-flex items-center gap-1 mt-1"
            >
              <ListChecks className="h-3 w-3" />
              {showScheduled ? "Ocultar otros programados" : `Ver otros posts programados de ${clientName}`}
            </button>

            {showScheduled && (
              <div className="border rounded-md p-2 mt-1 bg-background max-h-[160px] overflow-y-auto">
                {scheduledList.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground">No hay otras publicaciones programadas.</div>
                ) : (
                  <ul className="space-y-1 text-[11px]">
                    {scheduledList.map((p) => (
                      <li key={p.id} className={`flex justify-between gap-2 ${p.id === publication.id ? "font-semibold text-primary" : ""}`}>
                        <span className="truncate">{p.name}{p.id === publication.id ? " (esta)" : ""}</span>
                        <span className="text-muted-foreground shrink-0">
                          {format(new Date(p.scheduled_publish_at), "dd/MM HH:mm", { locale: es })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {meta.publish_error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs break-all">{meta.publish_error}</AlertDescription>
            </Alert>
          )}

          {(meta.instagram_media_id || meta.facebook_post_id) && (
            <div className="text-[11px] text-muted-foreground space-y-0.5">
              {meta.instagram_media_id && <div>IG media id: {meta.instagram_media_id}</div>}
              {meta.facebook_post_id && <div>FB post id: {meta.facebook_post_id}</div>}
            </div>
          )}
        </>
      )}

      <DriveFilePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleDrivePick}
        busy={busy}
        multiple={pickerMultiple}
      />
    </div>
  );
};
