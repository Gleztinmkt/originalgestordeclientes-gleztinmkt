import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Instagram, Facebook, Link2, Loader2, RefreshCw, Unlink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface MetaConnectionButtonProps {
  clientId: string;
  clientName: string;
  compact?: boolean;
}

interface SocialConnection {
  id: string;
  status: string;
  facebook_page_id: string | null;
  facebook_page_name: string | null;
  instagram_business_account_id: string | null;
  instagram_username: string | null;
  last_error: string | null;
  token_expires_at: string | null;
}

export const MetaConnectionButton = ({ clientId, clientName, compact }: MetaConnectionButtonProps) => {
  const [connection, setConnection] = useState<SocialConnection | null>(null);
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<Array<{ id: string; name: string; ig: string | null }> | null>(null);
  const [showPagePicker, setShowPagePicker] = useState(false);

  const refresh = async () => {
    const { data } = await (supabase as any)
      .from("social_connections")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();
    setConnection(data || null);
  };

  useEffect(() => {
    refresh();
  }, [clientId]);

  // Listen for OAuth popup messages
  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === "meta_oauth_success" && ev.data.client_id === clientId) {
        toast({ title: "Cuenta Meta autorizada", description: "Seleccioná la página correspondiente." });
        if (Array.isArray(ev.data.pages) && ev.data.pages.length > 1) {
          setPages(ev.data.pages);
          setShowPagePicker(true);
        }
        refresh();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [clientId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("meta_oauth") !== "success" || params.get("client_id") !== clientId) return;

    try {
      const urlPages = JSON.parse(params.get("pages") || "[]");
      if (Array.isArray(urlPages) && urlPages.length > 1) {
        setPages(urlPages);
        setShowPagePicker(true);
        toast({ title: "Cuenta Meta autorizada", description: "Seleccioná la página correspondiente." });
      } else {
        toast({ title: "Instagram/Facebook conectado" });
      }
      refresh();
    } catch (e) {
      toast({ title: "Error", description: "No se pudo leer la selección de páginas de Meta.", variant: "destructive" });
    } finally {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [clientId]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await invokeEdgeFunction<{ auth_url: string }>("meta-oauth-start", { client_id: clientId });
      if (!res?.auth_url) throw new Error("No se obtuvo URL de autorización");
      window.open(res.auth_url, "_blank", "width=600,height=700");
    } catch (e: any) {
      toast({ title: "Error", description: e.message || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPage = async (pageId: string) => {
    setLoading(true);
    try {
      await invokeEdgeFunction("meta-select-page", { client_id: clientId, page_id: pageId });
      toast({ title: "Página seleccionada", description: "Cuenta conectada correctamente." });
      setShowPagePicker(false);
      setPages(null);
      await refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(`¿Desconectar Meta de ${clientName}?`)) return;
    await (supabase as any).from("social_connections").delete().eq("client_id", clientId);
    setConnection(null);
    toast({ title: "Cuenta desconectada" });
  };

  const isConnected = connection?.status === "connected";
  const isPending = connection?.status === "pending_page_selection";
  const isError = connection?.status === "error";

  return (
    <>
      <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2 p-3 rounded-lg border bg-muted/30"}>
        {!compact && (
          <div className="text-sm font-medium">Conexión Meta (Instagram / Facebook)</div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {isConnected && (
            <>
              {connection?.instagram_username && (
                <Badge variant="secondary" className="gap-1">
                  <Instagram className="h-3 w-3" /> @{connection.instagram_username}
                </Badge>
              )}
              {connection?.facebook_page_name && (
                <Badge variant="secondary" className="gap-1">
                  <Facebook className="h-3 w-3" /> {connection.facebook_page_name}
                </Badge>
              )}
              <Button size="sm" variant="ghost" onClick={handleConnect} disabled={loading}>
                <RefreshCw className="h-3 w-3 mr-1" /> Reconectar
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDisconnect}>
                <Unlink className="h-3 w-3 mr-1" /> Desconectar
              </Button>
            </>
          )}
          {isPending && (
            <>
              <Badge variant="outline">Pendiente: seleccionar página</Badge>
              <Button size="sm" variant="outline" onClick={handleConnect} disabled={loading}>
                Reintentar OAuth
              </Button>
            </>
          )}
          {isError && (
            <>
              <Badge variant="destructive">Error: requiere reconexión</Badge>
              <Button size="sm" variant="outline" onClick={handleConnect} disabled={loading}>
                Reconectar
              </Button>
            </>
          )}
          {!connection && (
            <Button size="sm" variant="outline" onClick={handleConnect} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Conectar Instagram / Facebook
            </Button>
          )}
        </div>
        {connection?.last_error && (
          <div className="text-xs text-destructive truncate" title={connection.last_error}>
            {connection.last_error}
          </div>
        )}
      </div>

      <Dialog open={showPagePicker} onOpenChange={setShowPagePicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar página de Facebook</DialogTitle>
            <DialogDescription>
              Elegí la página correspondiente a {clientName}. Si tiene Instagram Business vinculado, se conectará automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {pages?.map((p) => (
              <Button
                key={p.id}
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleSelectPage(p.id)}
                disabled={loading}
              >
                <span>{p.name}</span>
                {p.ig && <Badge variant="secondary" className="gap-1"><Instagram className="h-3 w-3" /> IG</Badge>}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
