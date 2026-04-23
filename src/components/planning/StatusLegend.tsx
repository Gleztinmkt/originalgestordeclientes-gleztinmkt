import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";

interface StatusLegendProps {
  getStatusColor: (status: 'hacer' | 'no_hacer' | 'consultar') => string;
}

const PRODUCTION_STATES = [
  { key: 'sin_hacer', label: 'Sin hacer', color: 'bg-gray-400', desc: 'Aún no se inició el trabajo' },
  { key: 'en_proceso', label: 'En proceso', color: 'bg-blue-500', desc: 'Se está trabajando en la planificación' },
  { key: 'en_revision', label: 'En revisión', color: 'bg-yellow-500', desc: 'Pendiente de revisión / correcciones' },
  { key: 'aprobado', label: 'Aprobado', color: 'bg-emerald-500', desc: 'Aprobado por el cliente / equipo' },
  { key: 'cargado', label: 'Cargado al sistema', color: 'bg-purple-500', desc: 'Ya fue cargado al calendario / sistema' },
];

export const StatusLegend = ({ getStatusColor }: StatusLegendProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 bg-card p-4 rounded-lg shadow-sm border border-border">
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full ${getStatusColor('hacer')}`} />
        <span className="text-sm">Hacer</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full ${getStatusColor('no_hacer')}`} />
        <span className="text-sm">No hacer</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full ${getStatusColor('consultar')}`} />
        <span className="text-sm">Consultar</span>
      </div>

      <div className="h-6 w-px bg-border mx-2" />

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Producción:</span>
        {PRODUCTION_STATES.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${s.color}`} />
            <span className="text-xs">{s.label}</span>
          </div>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" aria-label="Ayuda de estados">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-2">Estados de planificación</h4>
              <ul className="space-y-1.5 text-xs">
                <li className="flex gap-2"><div className="w-3 h-3 rounded-full bg-green-500 mt-0.5" /><span><strong>Hacer:</strong> publicar este mes</span></li>
                <li className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500 mt-0.5" /><span><strong>No hacer:</strong> no publicar este mes</span></li>
                <li className="flex gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500 mt-0.5" /><span><strong>Consultar:</strong> a definir con el cliente</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Estados de producción</h4>
              <ul className="space-y-1.5 text-xs">
                {PRODUCTION_STATES.map(s => (
                  <li key={s.key} className="flex gap-2">
                    <div className={`w-3 h-3 rounded-full mt-0.5 ${s.color}`} />
                    <span><strong>{s.label}:</strong> {s.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export { PRODUCTION_STATES };
export type ProductionStatus = 'sin_hacer' | 'en_proceso' | 'en_revision' | 'aprobado' | 'cargado';
