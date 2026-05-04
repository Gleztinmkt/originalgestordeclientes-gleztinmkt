import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, Calendar as CalendarIcon, RefreshCw, Instagram, Facebook, AlertCircle, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { toast } from "@/hooks/use-toast";
import { Publication } from "../client/publication/types";
import { MetaConnectionButton } from "./MetaConnectionButton";

interface MetaPublishSectionProps {
  publication: Publication;
  clientId: string;
  clientName: string;
  copywriting: string;
  onPublishedInCrm?: () => void; // called when user accepts to mark CRM as published
}

interface SocialConnection {
  status: string;
  facebook_page_id: string | null;
  facebook_page_name: string | null;
  instagram_business_account_id: string | null;
  instagram_username: string | null;
}

interface PubMeta {
  drive_file_url?: string | null;
  media_url?: string | null;
  publish_status?: string | null;
  publish_error?: string | null;
  meta_caption?: string | null;
  publish_to_instagram?: boolean | null;
  publish_to_facebook?: boolean | null;
  scheduled_publish_at?: string | null;
  instagram_media_id?: string | null;
  facebook_post_id?: string | null;
}

export const MetaPublishSection = ({
  publication,
  clientId,
  clientName,
  copywriting,
  onPublishedInCrm,
}: MetaPublishSectionProps) => {
  const [connection, setConnection] = useState<SocialConnection | null>(null);
  const [meta, setMeta] = useState<PubMeta>({});
  const [driveUrl, setDriveUrl] = useState("");
  const [caption, setCaption] = useState(copywriting || "");
  const [toIG, setToIG] = useState(true);
  const [toFB, setToFB] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [{ data: conn }, { data: pub }] = await Promise.all([
      (supabase as any).from("social_connections").select("*").eq("client_id", clientId).maybeSingle(),
      (supabase as any).from("publications").select("drive_file_url,media_url,publish_status,publish_error,meta_caption,publish_to_instagram,publish_to_facebook,scheduled_publish_at,instagram_media_id,facebook_post_id").eq("id", publication.id).maybeSingle(),
    ]);
    setConnection(conn || null);
    if (pub) {
      setMeta(pub);
      setDriveUrl(pub.drive_file_url || "");
      setCaption(pub.meta_caption || copywriting || "");
      if (typeof pub.publish_to_instagram === "boolean") setToIG(pub.publish_to_instagram);
      if (typeof pub.publish_to_facebook === "boolean") setToFB(pub.publish_to_facebook);
      if (pub.scheduled_publish_at) setScheduleAt(pub.scheduled_publish_at.slice(0, 16));
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publication.id, clientId]);

  const isConnected = connection?.status === "connected";

  const persistMeta = async (patch: Partial<PubMeta>) => {
    await (supabase as any).from("publications").update(patch).eq("id", publication.id);
  };

  const handlePrepareMedia = async () => {
    if (!driveUrl) {
      toast({ title: "Falta el link de Drive", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const r = await invokeEdgeFunction<{ media_url: string }>("prepare-drive-media", {
        publication_id: publication.id,
        drive_url: driveUrl,
      });
      toast({ title: "Archivo listo", description: "Subido a Storage para publicar." });
      await refresh();
    } catch (e: any) {
      toast({ title: "Error preparando archivo", description: e.message || String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handlePublishNow = async () => {
    if (!isConnected) return toast({ title: "Conectá Meta primero", variant: "destructive" });
    if (!meta.media_url) return toast({ title: "Preparar archivo de Drive primero", variant: "destructive" });
    if (!toIG && !toFB) return toast({ title: "Elegí al menos una plataforma", variant: "destructive" });

    setBusy(true);
    try {
      await persistMeta({
        meta_caption: caption,
        publish_to_instagram: toIG,
        publish_to_facebook: toFB,
      });
      const r = await invokeEdgeFunction<any>("meta-publish-now", { publication_id: publication.id });
      if (r?.error) throw new Error(r.error);
      toast({ title: "¡Publicado!", description: "Posteado en redes correctamente." });
      await refresh();

      // Ask CRM mark
      setTimeout(() => {
        if (confirm("¿Querés marcar esta publicación como publicada en el CRM y descontarla del paquete?")) {
          onPublishedInCrm?.();
        }
      }, 200);
    } catch (e: any) {
      toast({ title: "Error al publicar", description: e.message || String(e), variant: "destructive" });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleAt) return toast({ title: "Elegí fecha y hora", variant: "destructive" });
    setBusy(true);
    try {
      await persistMeta({
        meta_caption: caption,
        publish_to_instagram: toIG,
        publish_to_facebook: toFB,
        scheduled_publish_at: new Date(scheduleAt).toISOString(),
        publish_status: "scheduled",
      } as any);
      toast({ title: "Programada", description: "Se publicará automáticamente cuando esté activo el scheduler." });
      await refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || String(e), variant: "destructive" });
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

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Send className="h-4 w-4" />
          Publicación en redes
        </div>
        <Badge variant={status === "published" ? "default" : status === "failed" ? "destructive" : "secondary"}>
          {status}
        </Badge>
      </div>

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

      <div className="space-y-2">
        <Label className="text-xs">Archivo desde Google Drive (URL pública o "cualquiera con el enlace")</Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://drive.google.com/file/d/..."
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            className="text-xs"
          />
          <Button type="button" size="sm" variant="secondary" onClick={handlePrepareMedia} disabled={busy || !driveUrl}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preparar"}
          </Button>
        </div>
        {meta.media_url && (
          <a href={meta.media_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 flex items-center gap-1">
            <Link2 className="h-3 w-3" /> Archivo listo en Storage
          </a>
        )}
        <div className="text-[11px] text-muted-foreground">
          Recomendado: Reels 9:16 MP4, fotos JPG/PNG buena calidad. Editado y listo para subir.
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Caption (Meta)</Label>
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="min-h-[80px] text-xs"
          placeholder="Copy a publicar en redes (se autocompleta del copywriting)"
        />
      </div>

      <div className="flex items-center gap-4 text-xs">
        <label className="flex items-center gap-2"><Checkbox checked={toIG} onCheckedChange={(c) => setToIG(!!c)} /> Instagram</label>
        <label className="flex items-center gap-2"><Checkbox checked={toFB} onCheckedChange={(c) => setToFB(!!c)} /> Facebook</label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={handlePublishNow} disabled={busy || !isConnected || !meta.media_url} className="gap-1">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Publicar ahora
        </Button>
        {status === "failed" && (
          <Button type="button" size="sm" variant="outline" onClick={handleRetry} disabled={busy} className="gap-1">
            <RefreshCw className="h-4 w-4" /> Reintentar
          </Button>
        )}
      </div>

      <div className="space-y-1 pt-2 border-t">
        <Label className="text-xs flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> Programar (V2 - scheduler aún no activo)</Label>
        <div className="flex gap-2">
          <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="text-xs" />
          <Button type="button" size="sm" variant="outline" onClick={handleSchedule} disabled={busy || !meta.media_url}>
            Programar
          </Button>
        </div>
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
    </div>
  );
};
