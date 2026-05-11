import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Activity, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  clientId: string;
  isConnected: boolean;
  onPickDateTime: (isoLocal: string) => void;
}

const DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
// Display 8 buckets at 0,3,6,9,12,15,18,21 (Instagram-style)
const HOUR_BUCKETS = [0, 3, 6, 9, 12, 15, 18, 21];

export const AudienceActivityCard = ({ clientId, isConnected, onPickDateTime }: Props) => {
  const [loading, setLoading] = useState(false);
  const [grid, setGrid] = useState<number[][] | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  const load = useCallback(async (refresh = false) => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const r = await invokeEdgeFunction<any>("meta-audience-activity", { client_id: clientId, refresh });
      if (r?.error) {
        if (r.error === "no_connection") setError("Conectá Instagram para ver los momentos de más actividad.");
        else if (r.error === "no_data") setError("No hay datos suficientes de actividad para esta cuenta.");
        else setError(r.message || "No se pudieron cargar los datos.");
        setGrid(null);
        return;
      }
      setGrid(r.data?.grid || null);
      setFetchedAt(r.fetched_at || null);
    } catch (e: any) {
      setError(e.message || "Error al cargar actividad");
    } finally {
      setLoading(false);
    }
  }, [clientId, isConnected]);

  useEffect(() => { load(false); }, [load]);

  if (!isConnected) {
    return (
      <div className="p-3 border rounded-lg bg-background space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="h-4 w-4 text-primary" /> Momentos de más actividad
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Conectá Instagram para ver los momentos de más actividad.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const dayRow = grid?.[selectedDay] || [];
  // Aggregate to 8 buckets of 3 hours each
  const buckets = HOUR_BUCKETS.map((startH) => {
    let sum = 0;
    for (let i = 0; i < 3; i++) sum += dayRow[startH + i] || 0;
    return sum / 3;
  });
  const maxBucket = Math.max(1, ...buckets);

  // Best hour: maximum hour (0..23) of selected day
  let bestHour = 0;
  let bestVal = -1;
  dayRow.forEach((v, h) => { if (v > bestVal) { bestVal = v; bestHour = h; } });

  const handleUseTime = () => {
    if (!grid || bestVal <= 0) {
      toast({ title: "Sin sugerencia disponible", variant: "destructive" });
      return;
    }
    // Find next date matching selectedDay weekday with bestHour, at least 1h from now
    const now = new Date();
    const target = new Date(now);
    target.setSeconds(0, 0);
    target.setMinutes(0);
    target.setHours(bestHour);
    let daysAhead = (selectedDay - now.getDay() + 7) % 7;
    if (daysAhead === 0 && target.getTime() <= now.getTime() + 60 * 60 * 1000) {
      daysAhead = 7;
    }
    target.setDate(target.getDate() + daysAhead);
    // datetime-local format: yyyy-MM-ddTHH:mm
    const pad = (n: number) => String(n).padStart(2, "0");
    const isoLocal = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
    onPickDateTime(isoLocal);
    toast({ title: "Horario sugerido aplicado", description: `${DAYS[selectedDay]} ${pad(bestHour)}:00` });
  };

  return (
    <div className="p-3 border rounded-lg bg-background space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="h-4 w-4 text-primary" /> Momentos de más actividad
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => load(true)} disabled={loading} className="h-7 gap-1 text-xs">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Actualizar
        </Button>
      </div>

      {error ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      ) : loading && !grid ? (
        <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando actividad…
        </div>
      ) : grid ? (
        <>
          {/* Day selector */}
          <div className="flex gap-1.5 justify-between">
            {DAYS.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDay(i)}
                className={`flex-1 h-8 rounded-full text-xs font-medium transition-colors ${
                  selectedDay === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Bar chart */}
          <div className="flex items-end justify-between gap-1.5 h-28 px-1 pt-2">
            {buckets.map((v, i) => {
              const heightPct = Math.max(6, (v / maxBucket) * 100);
              const isBest = HOUR_BUCKETS[i] <= bestHour && bestHour < HOUR_BUCKETS[i] + 3;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className={`w-full rounded-t-md rounded-b-sm transition-all ${
                      isBest ? "bg-gradient-to-t from-primary to-primary/70" : "bg-gradient-to-t from-primary/40 to-primary/20"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-end justify-between gap-1.5 px-1">
            {HOUR_BUCKETS.map((h) => (
              <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground">{h} h</div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t">
            <div className="text-xs">
              <div className="text-muted-foreground">Mejor horario</div>
              <div className="font-semibold">
                {DAYS[selectedDay]} {String(bestHour).padStart(2, "0")}:00
              </div>
            </div>
            <Button type="button" size="sm" onClick={handleUseTime} className="rounded-full text-xs">
              Usar este horario
            </Button>
          </div>

          {fetchedAt && (
            <div className="text-[10px] text-muted-foreground text-right">
              Última actualización: {format(new Date(fetchedAt), "dd/MM/yyyy HH:mm", { locale: es })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
