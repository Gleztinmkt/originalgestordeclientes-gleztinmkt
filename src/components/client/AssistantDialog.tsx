import { useState } from "react";
import { Bot, Send, Check, Loader2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { invokeEdgeFunction } from "@/lib/edge-functions";

interface AssistantDialogProps {
  onClientsUpdate: () => void;
}

interface PublicacionPendiente {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string;
  descripcion?: string;
  tiene_copy?: boolean;
  copywriting?: string;
}

interface ClienteIdentificado {
  id: string;
  nombre: string;
  confianza?: string;
  publicaciones_pendientes?: PublicacionPendiente[];
  total_aprobados?: number;
  publicaciones?: PublicacionPendiente[];
}

interface AssistantResponse {
  accion: string;
  mensaje_ia: string;
  clientes?: ClienteIdentificado[];
  clientes_con_aprobados?: ClienteIdentificado[];
  cliente?: { id: string; nombre: string };
  publicacion?: {
    id: string;
    nombre: string;
    tipo: string;
    fecha: string;
    copywriting?: string | null;
    descripcion?: string | null;
  };
  puede_descontar?: boolean;
  publicaciones?: Array<{
    id: string;
    titulo: string;
    tipo: string;
    fecha: string;
    copywriting?: string | null;
    descripcion?: string | null;
    cliente?: string;
  }>;
  error?: string;
}

export const AssistantDialog = ({ onClientsUpdate }: AssistantDialogProps) => {
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [selectedPubs, setSelectedPubs] = useState<Set<string>>(new Set());
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  const reset = () => {
    setMensaje("");
    setResponse(null);
    setSelectedPubs(new Set());
    setExpandedClients(new Set());
  };

  const handleSend = async () => {
    if (!mensaje.trim()) return;
    setLoading(true);
    setResponse(null);
    setSelectedPubs(new Set());

    try {
      const result = await invokeEdgeFunction<AssistantResponse>("telegram-assistant", { mensaje });
      setResponse(result);

      // Auto-expand all clients
      const clientIds = [
        ...(result.clientes ?? []).map((c) => c.id),
        ...(result.clientes_con_aprobados ?? []).map((c) => c.id),
      ];
      setExpandedClients(new Set(clientIds));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (pubIds: string[]) => {
    if (!pubIds.length) return;
    setConfirming(true);

    try {
      await invokeEdgeFunction("telegram-assistant", {
        accion: "marcar_publicadas",
        publicaciones_ids: pubIds,
      });
      toast({ title: "Publicaciones actualizadas", description: `${pubIds.length} publicación(es) marcada(s) como publicada(s)` });
      onClientsUpdate();
      reset();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  const togglePub = (id: string) => {
    setSelectedPubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleClient = (id: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allPubs = (clients: ClienteIdentificado[]) => {
    return clients.flatMap((c) => (c.publicaciones_pendientes ?? c.publicaciones ?? []).map((p) => p.id));
  };

  const selectAll = (clients: ClienteIdentificado[]) => {
    setSelectedPubs(new Set(allPubs(clients)));
  };

  const renderClients = (clients: ClienteIdentificado[]) => (
    <div className="space-y-3">
      {clients.length > 1 && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => selectAll(clients)}>
            Seleccionar todas
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSelectedPubs(new Set())}>
            Deseleccionar
          </Button>
        </div>
      )}

      {clients.map((client) => {
        const pubs = client.publicaciones_pendientes ?? client.publicaciones ?? [];
        const isExpanded = expandedClients.has(client.id);

        return (
          <div key={client.id} className="border border-border rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
              onClick={() => toggleClient(client.id)}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{client.nombre}</span>
                <Badge variant="secondary" className="text-xs">
                  {client.total_aprobados ?? pubs.length} pub(s)
                </Badge>
                {client.confianza && client.confianza !== "alta" && (
                  <Badge variant="outline" className="text-xs">{client.confianza}</Badge>
                )}
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {isExpanded && (
              <div className="border-t border-border p-2 space-y-1">
                {pubs.map((pub) => (
                  <label
                    key={pub.id}
                    className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedPubs.has(pub.id)}
                      onCheckedChange={() => togglePub(pub.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{pub.titulo}</span>
                        <Badge variant="outline" className="text-xs shrink-0">{pub.tipo}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(pub.fecha).toLocaleDateString("es-AR")}
                        {pub.tiene_copy !== undefined && (pub.tiene_copy ? " · Con copy" : " · Sin copy")}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {selectedPubs.size > 0 && (
        <Button
          className="w-full gap-2"
          onClick={() => handleConfirm(Array.from(selectedPubs))}
          disabled={confirming}
        >
          {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Marcar {selectedPubs.size} como publicada(s)
        </Button>
      )}
    </div>
  );

  const renderCopy = () => {
    if (!response?.publicacion) return null;
    const pub = response.publicacion;
    const copyText = pub.copywriting || pub.descripcion;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{pub.nombre}</span>
          <Badge variant="outline" className="text-xs">{pub.tipo}</Badge>
        </div>

        {copyText ? (
          <div className="bg-muted/50 rounded-lg p-3 relative">
            <pre className="text-sm whitespace-pre-wrap font-sans">{copyText}</pre>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 h-7 w-7 p-0"
              onClick={() => {
                navigator.clipboard.writeText(copyText);
                toast({ title: "Copiado al portapapeles" });
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No hay copy cargado para esta publicación</p>
        )}

        {response.puede_descontar && (
          <Button
            className="w-full gap-2"
            onClick={() => handleConfirm([pub.id])}
            disabled={confirming}
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Marcar como publicada y descontar
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-sm">
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">Asistente IA</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Asistente IA
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Ej: publiqué jacinto y glúteos..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !mensaje.trim()} size="icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {response && (
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-3">
              {response.mensaje_ia && (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  {response.mensaje_ia}
                </p>
              )}

              {response.accion === "identificar_clientes" && response.clientes && renderClients(response.clientes)}
              {response.accion === "listado_aprobados" && response.clientes_con_aprobados && renderClients(response.clientes_con_aprobados)}
              {response.accion === "mostrar_copy" && renderCopy()}
              {response.accion === "no_encontrado" && !response.mensaje_ia && (
                <p className="text-sm text-muted-foreground italic">No se encontraron resultados</p>
              )}
              {response.accion === "error" && (
                <p className="text-sm text-destructive">{response.mensaje_ia}</p>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
