import { Badge } from "@/components/ui/badge";
import { Video, Edit, CheckCircle2, AlertCircle, Upload } from "lucide-react";

export const StatusLegend = () => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Leyenda de estados</h3>
      <div className="flex flex-col space-y-1.5">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 flex items-center gap-1">
            <Video className="h-3 w-3" /> Grabar
          </Badge>
          <span className="text-xs">Falta grabar</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100 flex items-center gap-1">
            <Edit className="h-3 w-3" /> Editar
          </Badge>
          <span className="text-xs">Falta editar</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 flex items-center gap-1">
            <Edit className="h-3 w-3" /> En edición
          </Badge>
          <span className="text-xs">En proceso</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> En revisión
          </Badge>
          <span className="text-xs">Correcciones</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Aprobado
          </Badge>
          <span className="text-xs">Listo</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 flex items-center gap-1">
            <Upload className="h-3 w-3" /> Publicado
          </Badge>
          <span className="text-xs">En redes</span>
        </div>
      </div>
    </div>
  );
};