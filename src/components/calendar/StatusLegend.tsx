import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export const StatusLegend = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-2">
      <h3 className="font-medium mb-3">Estados</h3>
      <div className="space-y-2">
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 w-full justify-start gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Hacer
        </Badge>
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 w-full justify-start gap-2">
          <XCircle className="h-4 w-4" />
          No hacer
        </Badge>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 w-full justify-start gap-2">
          <AlertCircle className="h-4 w-4" />
          Consultar
        </Badge>
      </div>
    </div>
  );
};