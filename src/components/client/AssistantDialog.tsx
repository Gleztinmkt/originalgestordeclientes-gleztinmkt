import { useState } from "react";
import { Bot, Send, Check, Loader2, Copy, ChevronDown, ChevronUp, Package, User, BarChart3, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
  copy_text?: string;
}

interface ClienteIdentificado {
  id: string;
  nombre: string;
  confianza?: string;
  publicaciones_pendientes?: PublicacionPendiente[];
  total_aprobados?: number;
  publicaciones?: PublicacionPendiente[];
}

interface PlanUpdate {
  cliente: string;
  client_id?: string;
  mes: number;
  status?: string;
  descripcion?: string;
}

interface ProductionPub {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  descripcion?: string;
  copywriting?: string;
  designer?: string;
  filming_time?: string;
  links?: string;
  cliente?: string;
}

interface StatusGroup {
  estado: string;
  estado_key: string;
  cantidad: number;
  publicaciones?: ProductionPub[];
}

interface ClientProduction {
  id: string;
  nombre: string;
  estados: StatusGroup[];
}

interface PackageInfo {
  id: string;
  nombre: string;
  mes?: string;
  total: number;
  usadas: number;
  restantes: number;
  pagado?: boolean;
  ultimo_post?: string;
}

interface ClientInfo {
  id: string;
  nombre: string;
  telefono?: string;
  instagram?: string;
  facebook?: string;
  ultimo_post?: string;
  marketing_info?: string;
  info_general?: string;
  reuniones?: unknown[];
  redes_sociales?: unknown[];
  branding?: string;
  horarios_publicacion?: unknown[];
}

interface FilterClient {
  id: string;
  nombre: string;
  publicaciones: ProductionPub[];
}

interface ProposedPublication {
  client_id: string;
  client_name: string;
  name: string;
  type: string;
  date: string;
  description?: string;
  copywriting?: string;
  designer?: string | null;
  status: string;
  status_label: string;
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
  actualizaciones?: PlanUpdate[];
  publicacion_propuesta?: ProposedPublication;
  // New response types
  resumen_estados?: StatusGroup[];
  total?: number;
  resumen_global?: StatusGroup[];
  resumen_clientes?: ClientProduction[];
  paquetes?: PackageInfo[];
  resumen?: { total: number; usadas: number; restantes: number };
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
  const [discountCount, setDiscountCount] = useState<string>("");
  const [confirmedPlans, setConfirmedPlans] = useState<Set<number>>(new Set());
  const [correctionIndex, setCorrectionIndex] = useState<number | null>(null);
  const [correctionText, setCorrectionText] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const reset = () => {
    setMensaje("");
    setResponse(null);
    setSelectedPubs(new Set());
    setExpandedClients(new Set());
    setDiscountCount("");
    setConfirmedPlans(new Set());
    setCorrectionIndex(null);
    setCorrectionText("");
    setExpandedSections(new Set());
  };

  const handleSend = async () => {
    if (!mensaje.trim()) return;
    setLoading(true);
    setResponse(null);
    setSelectedPubs(new Set());
    setDiscountCount("");
    setExpandedSections(new Set());

    try {
      const result = await invokeEdgeFunction<AssistantResponse>("telegram-assistant", { mensaje });
      setResponse(result);

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
      const payload: Record<string, unknown> = {
        accion: "marcar_publicadas",
        publicaciones_ids: pubIds,
      };
      const count = parseInt(discountCount);
      if (count > 0) {
        payload.cantidad_descontar = count;
      }

      await invokeEdgeFunction("telegram-assistant", payload);
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

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allPubs = (clients: ClienteIdentificado[]) => {
    return clients.flatMap((c) => (c.publicaciones_pendientes ?? c.publicaciones ?? []).map((p) => p.id));
  };

  const selectAll = (clients: ClienteIdentificado[]) => {
    setSelectedPubs(new Set(allPubs(clients)));
  };

  const statusColor = (key: string) => {
    const colors: Record<string, string> = {
      needs_recording: "bg-red-500",
      needs_editing: "bg-orange-500",
      in_editing: "bg-yellow-500",
      in_review: "bg-blue-500",
      approved: "bg-green-500",
      in_cloud: "bg-purple-500",
    };
    return colors[key] || "bg-muted-foreground";
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
                {pubs.map((pub) => {
                  const isSelected = selectedPubs.has(pub.id);
                  const copyText = pub.copy_text || pub.copywriting || pub.descripcion;

                  return (
                    <div key={pub.id} className="rounded hover:bg-muted/50">
                      <label className="flex items-start gap-2 p-2 cursor-pointer">
                        <Checkbox
                          checked={isSelected}
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

                      {isSelected && copyText && (
                        <div className="ml-8 mr-2 mb-2 bg-muted/50 rounded-lg p-3 relative">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">Copy:</p>
                          <pre className="text-sm whitespace-pre-wrap font-sans pr-8">{copyText}</pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 h-7 w-7 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.clipboard.writeText(copyText);
                              toast({ title: "Copiado al portapapeles" });
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      {isSelected && !copyText && (
                        <p className="ml-8 mr-2 mb-2 text-xs text-muted-foreground italic">Sin copy cargado</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {selectedPubs.size > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Descontar del paquete:</label>
            <Input
              type="number"
              min="0"
              placeholder={String(selectedPubs.size)}
              value={discountCount}
              onChange={(e) => setDiscountCount(e.target.value)}
              className="w-24 h-8 text-sm"
            />
            <span className="text-xs text-muted-foreground">
              (vacío = {selectedPubs.size})
            </span>
          </div>
          <Button
            className="w-full gap-2"
            onClick={() => handleConfirm(Array.from(selectedPubs))}
            disabled={confirming}
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Marcar {selectedPubs.size} como publicada(s)
          </Button>
        </div>
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
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Descontar del paquete:</label>
              <Input
                type="number"
                min="0"
                placeholder="1"
                value={discountCount}
                onChange={(e) => setDiscountCount(e.target.value)}
                className="w-24 h-8 text-sm"
              />
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => handleConfirm([pub.id])}
              disabled={confirming}
            >
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Marcar como publicada y descontar
            </Button>
          </div>
        )}
      </div>
    );
  };

  const handleCorrection = async (index: number) => {
    if (!correctionText.trim() || !response?.actualizaciones?.[index]) return;
    setCorrecting(true);
    try {
      const u = response.actualizaciones[index];
      const months = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      const prompt = `Corregí la planificación de ${u.cliente} para ${months[u.mes]}: ${correctionText.trim()}`;
      const result = await invokeEdgeFunction<AssistantResponse>("telegram-assistant", { mensaje: prompt });
      
      if ((result.accion === "planificacion_propuesta" || result.accion === "planificacion_actualizada") && result.actualizaciones?.length) {
        const updated = [...(response.actualizaciones ?? [])];
        updated[index] = result.actualizaciones[0];
        setResponse({ ...response, actualizaciones: updated, mensaje_ia: response.mensaje_ia });
        setConfirmedPlans((prev) => { const n = new Set(prev); n.delete(index); return n; });
        toast({ title: "Corregido", description: `Planificación de ${u.cliente} actualizada` });
      } else {
        toast({ title: "No se pudo corregir", description: result.mensaje_ia, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCorrecting(false);
      setCorrectionIndex(null);
      setCorrectionText("");
    }
  };

  const handleConfirmPlanning = async () => {
    if (!response?.actualizaciones || confirmedPlans.size === 0) return;
    setConfirming(true);
    try {
      const selectedUpdates = response.actualizaciones
        .filter((_, i) => confirmedPlans.has(i))
        .map((u) => ({
          client_id: u.client_id,
          month: u.mes,
          status: u.status,
          description: u.descripcion,
        }));

      await invokeEdgeFunction("telegram-assistant", {
        accion: "confirmar_planificacion",
        updates: selectedUpdates,
      });

      toast({ title: "Planificación confirmada", description: `${selectedUpdates.length} planificación(es) aplicada(s) exitosamente` });
      onClientsUpdate();
      reset();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  const togglePlanConfirm = (index: number) => {
    setConfirmedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const confirmAllPlans = () => {
    if (!response?.actualizaciones) return;
    setConfirmedPlans(new Set(response.actualizaciones.map((_, i) => i)));
  };

  const renderPlanningUpdate = () => {
    if (!response?.actualizaciones?.length) return null;
    const months = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    const allConfirmed = response.actualizaciones.length === confirmedPlans.size;

    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={confirmAllPlans} disabled={allConfirmed}>
            <Check className="h-3.5 w-3.5 mr-1" />
            Confirmar todas
          </Button>
          {confirmedPlans.size > 0 && (
            <Button size="sm" variant="outline" onClick={() => setConfirmedPlans(new Set())}>
              Deseleccionar
            </Button>
          )}
        </div>

        {response.actualizaciones.map((u, i) => {
          const isConfirmed = confirmedPlans.has(i);
          const isEditing = correctionIndex === i;

          return (
            <div key={i} className={`border rounded-lg p-3 space-y-2 transition-colors ${isConfirmed ? "border-green-500/50 bg-green-500/5" : "border-border"}`}>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isConfirmed}
                  onCheckedChange={() => togglePlanConfirm(i)}
                />
                <div className={`w-3 h-3 rounded-full shrink-0 ${u.status === "hacer" ? "bg-green-500" : u.status === "no_hacer" ? "bg-red-500" : "bg-yellow-500"}`} />
                <span className="text-sm font-medium">{u.cliente}</span>
                <Badge variant="outline" className="text-xs">{months[u.mes]}</Badge>
                {u.status && <Badge variant="secondary" className="text-xs">{u.status}</Badge>}
              </div>

              {u.descripcion && (
                <div className="bg-muted/50 rounded p-2 ml-7">
                  <p className="text-xs text-muted-foreground mb-0.5">Descripción:</p>
                  <p className="text-sm whitespace-pre-wrap">{u.descripcion}</p>
                </div>
              )}

              {!isConfirmed && (
                <div className="ml-7">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ej: cambiá el estado a no_hacer..."
                        value={correctionText}
                        onChange={(e) => setCorrectionText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !correcting && handleCorrection(i)}
                        className="h-8 text-sm"
                        disabled={correcting}
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleCorrection(i)} disabled={correcting || !correctionText.trim()} className="h-8 shrink-0">
                        {correcting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setCorrectionIndex(null); setCorrectionText(""); }} className="h-8 shrink-0">
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setCorrectionIndex(i); setCorrectionText(""); }}>
                      Corregir
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {confirmedPlans.size > 0 && (
          <Button
            className="w-full gap-2"
            onClick={handleConfirmPlanning}
            disabled={confirming}
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirmar {confirmedPlans.size} seleccionada(s)
          </Button>
        )}
      </div>
    );
  };

  // ── New renderers ──

  const renderProductionPub = (pub: ProductionPub) => (
    <div key={pub.id} className="border border-border rounded p-2 space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium truncate">{pub.nombre}</span>
        <Badge variant="outline" className="text-xs shrink-0">{pub.tipo}</Badge>
      </div>
      <div className="text-xs text-muted-foreground">
        {new Date(pub.fecha).toLocaleDateString("es-AR")}
        {pub.designer && ` · 🎨 ${pub.designer}`}
        {pub.filming_time && ` · 🎬 ${pub.filming_time}`}
      </div>
      {pub.descripcion && (
        <div className="bg-muted/50 rounded p-2 mt-1">
          <p className="text-xs text-muted-foreground mb-0.5 font-medium">Descripción:</p>
          <p className="text-sm whitespace-pre-wrap">{pub.descripcion}</p>
        </div>
      )}
      {pub.copywriting && (
        <div className="bg-muted/50 rounded p-2 mt-1 relative">
          <p className="text-xs text-muted-foreground mb-0.5 font-medium">Copy:</p>
          <pre className="text-sm whitespace-pre-wrap font-sans pr-8">{pub.copywriting}</pre>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-1 right-1 h-6 w-6 p-0"
            onClick={() => {
              navigator.clipboard.writeText(pub.copywriting!);
              toast({ title: "Copiado al portapapeles" });
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )}
      {pub.links && (
        <p className="text-xs text-muted-foreground">🔗 {pub.links}</p>
      )}
    </div>
  );

  const renderEstadoProduccion = () => {
    if (!response?.resumen_estados) return null;

    return (
      <div className="space-y-3">
        {response.resumen_estados.map((group) => {
          const isExpanded = expandedSections.has(group.estado_key);
          return (
            <div key={group.estado_key} className="border border-border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                onClick={() => toggleSection(group.estado_key)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${statusColor(group.estado_key)}`} />
                  <span className="text-sm font-medium">{group.estado}</span>
                  <Badge variant="secondary" className="text-xs">{group.cantidad}</Badge>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {isExpanded && group.publicaciones && (
                <div className="border-t border-border p-2 space-y-2">
                  {group.publicaciones.map(renderProductionPub)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderResumenProduccion = () => {
    if (!response?.resumen_global) return null;

    return (
      <div className="space-y-4">
        {/* Global summary */}
        <div className="grid grid-cols-2 gap-2">
          {response.resumen_global.map((g) => (
            <div key={g.estado_key} className="border border-border rounded-lg p-2.5 flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusColor(g.estado_key)}`} />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{g.estado}</p>
                <p className="text-lg font-bold leading-tight">{g.cantidad}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Per client */}
        {response.resumen_clientes && response.resumen_clientes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Por cliente:</p>
            {response.resumen_clientes.map((client) => {
              const isExpanded = expandedSections.has(`client-${client.id}`);
              return (
                <div key={client.id} className="border border-border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-2.5 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => toggleSection(`client-${client.id}`)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{client.nombre}</span>
                      {client.estados.map((e) => (
                        <span key={e.estado_key} className="inline-flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${statusColor(e.estado_key)}`} />
                          <span className="text-xs text-muted-foreground">{e.cantidad}</span>
                        </span>
                      ))}
                    </div>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border p-2 space-y-1">
                      {client.estados.map((e) => (
                        <div key={e.estado_key} className="flex items-center gap-2 text-sm">
                          <div className={`w-2.5 h-2.5 rounded-full ${statusColor(e.estado_key)}`} />
                          <span>{e.estado}:</span>
                          <span className="font-medium">{e.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderEstadoPaquetes = () => {
    if (!response?.paquetes) return null;

    return (
      <div className="space-y-3">
        {response.resumen && (
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{response.resumen.restantes}</p>
            <p className="text-xs text-muted-foreground">publicaciones restantes</p>
            <Progress value={(response.resumen.usadas / response.resumen.total) * 100} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{response.resumen.usadas} / {response.resumen.total} usadas</p>
          </div>
        )}

        {response.paquetes.map((pkg) => {
          const pct = pkg.total > 0 ? (pkg.usadas / pkg.total) * 100 : 0;
          return (
            <div key={pkg.id || pkg.nombre} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{pkg.nombre}</span>
                </div>
                {pkg.mes && <Badge variant="outline" className="text-xs">{pkg.mes}</Badge>}
              </div>
              <Progress value={pct} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{pkg.usadas} usadas</span>
                <span>{pkg.restantes} restantes</span>
                <span>{pkg.total} total</span>
              </div>
              {pkg.pagado !== undefined && (
                <Badge variant={pkg.pagado ? "secondary" : "destructive"} className="text-xs">
                  {pkg.pagado ? "Pagado" : "Sin pagar"}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderInfoCliente = () => {
    const clientData = response as unknown as { cliente: ClientInfo };
    if (!clientData?.cliente) return null;
    const c = clientData.cliente;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{c.nombre}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {c.telefono && (
            <div className="border border-border rounded p-2">
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <p>{c.telefono}</p>
            </div>
          )}
          {c.instagram && (
            <div className="border border-border rounded p-2">
              <p className="text-xs text-muted-foreground">Instagram</p>
              <p>{c.instagram}</p>
            </div>
          )}
          {c.facebook && (
            <div className="border border-border rounded p-2">
              <p className="text-xs text-muted-foreground">Facebook</p>
              <p>{c.facebook}</p>
            </div>
          )}
          {c.ultimo_post && (
            <div className="border border-border rounded p-2">
              <p className="text-xs text-muted-foreground">Último post</p>
              <p>{c.ultimo_post}</p>
            </div>
          )}
        </div>

        {c.info_general && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Info general</p>
            <p className="text-sm whitespace-pre-wrap">{c.info_general}</p>
          </div>
        )}

        {c.branding && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Branding</p>
            <p className="text-sm whitespace-pre-wrap">{c.branding}</p>
          </div>
        )}

        {c.marketing_info && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Info de marketing</p>
            <p className="text-sm whitespace-pre-wrap">{c.marketing_info}</p>
          </div>
        )}

        {Array.isArray(c.reuniones) && c.reuniones.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Reuniones</p>
            {c.reuniones.map((r: any, i: number) => (
              <div key={i} className="text-sm border-b border-border last:border-0 pb-1 mb-1 last:pb-0 last:mb-0">
                {typeof r === "string" ? r : JSON.stringify(r)}
              </div>
            ))}
          </div>
        )}

        {Array.isArray(c.horarios_publicacion) && c.horarios_publicacion.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Horarios de publicación</p>
            {c.horarios_publicacion.map((h: any, i: number) => (
              <div key={i} className="text-sm">
                {typeof h === "string" ? h : JSON.stringify(h)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFiltroEstado = () => {
    if (!response?.clientes) return null;
    const clients = response.clientes as unknown as FilterClient[];

    return (
      <div className="space-y-3">
        {clients.map((client) => {
          const isExpanded = expandedSections.has(`filter-${client.id}`);
          return (
            <div key={client.id} className="border border-border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                onClick={() => toggleSection(`filter-${client.id}`)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{client.nombre}</span>
                  <Badge variant="secondary" className="text-xs">{client.publicaciones.length}</Badge>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {isExpanded && (
                <div className="border-t border-border p-2 space-y-2">
                  {client.publicaciones.map(renderProductionPub)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  const handleConfirmCreatePublication = async () => {
    if (!response?.publicacion_propuesta) return;
    setConfirming(true);
    try {
      await invokeEdgeFunction("telegram-assistant", {
        accion: "confirmar_crear_publicacion",
        publicacion_propuesta: response.publicacion_propuesta,
      });
      toast({ title: "Publicación creada", description: `"${response.publicacion_propuesta.name}" creada exitosamente` });
      onClientsUpdate();
      reset();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  const renderPublicacionPropuesta = () => {
    if (!response?.publicacion_propuesta) return null;
    const pub = response.publicacion_propuesta;
    const typeLabels: Record<string, string> = { reel: "Reel", carousel: "Carrusel", image: "Imagen" };

    return (
      <div className="space-y-3">
        <div className="border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{pub.name}</span>
            <Badge variant="outline" className="text-xs">{typeLabels[pub.type] || pub.type}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Fecha</p>
              <p>{new Date(pub.date).toLocaleDateString("es-AR")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <p>{pub.status_label}</p>
            </div>
            {pub.designer && (
              <div>
                <p className="text-xs text-muted-foreground">Diseñador</p>
                <p>{pub.designer}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p>{pub.client_name}</p>
            </div>
          </div>
          {pub.description && (
            <div className="bg-muted/50 rounded p-2">
              <p className="text-xs text-muted-foreground mb-0.5 font-medium">Descripción</p>
              <p className="text-sm whitespace-pre-wrap">{pub.description}</p>
            </div>
          )}
          {pub.copywriting && (
            <div className="bg-muted/50 rounded p-2 relative">
              <p className="text-xs text-muted-foreground mb-0.5 font-medium">Copywriting</p>
              <pre className="text-sm whitespace-pre-wrap font-sans pr-8">{pub.copywriting}</pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={() => {
                  navigator.clipboard.writeText(pub.copywriting!);
                  toast({ title: "Copiado al portapapeles" });
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 gap-2"
            onClick={handleConfirmCreatePublication}
            disabled={confirming}
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirmar y crear
          </Button>
          <Button variant="outline" onClick={reset}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  };


    return (
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
            placeholder="Ej: ¿qué falta grabar de Soledad?"
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
                  {response.accion === "estado_produccion" && <BarChart3 className="h-4 w-4 inline mr-1.5 -mt-0.5" />}
                  {response.accion === "resumen_produccion" && <BarChart3 className="h-4 w-4 inline mr-1.5 -mt-0.5" />}
                  {response.accion === "estado_paquetes" && <Package className="h-4 w-4 inline mr-1.5 -mt-0.5" />}
                  {response.accion === "info_cliente" && <User className="h-4 w-4 inline mr-1.5 -mt-0.5" />}
                  {response.accion === "filtro_estado" && <Filter className="h-4 w-4 inline mr-1.5 -mt-0.5" />}
                  {response.mensaje_ia}
                </p>
              )}

              {response.accion === "identificar_clientes" && response.clientes && renderClients(response.clientes)}
              {response.accion === "listado_aprobados" && response.clientes_con_aprobados && renderClients(response.clientes_con_aprobados)}
              {response.accion === "mostrar_copy" && renderCopy()}
              {(response.accion === "planificacion_propuesta" || response.accion === "planificacion_actualizada") && renderPlanningUpdate()}
              {response.accion === "estado_produccion" && renderEstadoProduccion()}
              {response.accion === "resumen_produccion" && renderResumenProduccion()}
              {response.accion === "estado_paquetes" && renderEstadoPaquetes()}
              {response.accion === "info_cliente" && renderInfoCliente()}
              {response.accion === "filtro_estado" && renderFiltroEstado()}
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
