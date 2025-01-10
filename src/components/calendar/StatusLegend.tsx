import { Badge } from "@/components/ui/badge";
import { Camera, Edit, CheckCircle, AlertCircle, Upload } from "lucide-react";

export const StatusLegend = () => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Leyenda de estados</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Camera className="h-3 w-3" /> Grabar
          </Badge>
          <span className="text-sm">Falta grabar contenido</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Edit className="h-3 w-3" /> Editar
          </Badge>
          <span className="text-sm">Falta editar</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Edit className="h-3 w-3" /> En edición
          </Badge>
          <span className="text-sm">En proceso de edición</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> En revisión
          </Badge>
          <span className="text-sm">En fase de correcciones</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Aprobado
          </Badge>
          <span className="text-sm">Contenido aprobado</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Upload className="h-3 w-3" /> Publicado
          </Badge>
          <span className="text-sm">Contenido publicado</span>
        </div>
      </div>
    </div>
  );
};