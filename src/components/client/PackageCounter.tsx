
import { useState } from "react";
import { MinusCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

interface PackageCounterProps {
  total: number;
  used: number;
  onUpdateUsed: (newCount: number) => void;
  onUpdateLastUsed?: (date: string) => void;
  disabled?: boolean;
}

export const PackageCounter = ({ total, used, onUpdateUsed, onUpdateLastUsed, disabled }: PackageCounterProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const remaining = total - used;

  const handleIncrease = async () => {
    if (used < total && !disabled && !isUpdating) {
      try {
        setIsUpdating(true);
        
        // Actualizar estado local antes para UI responsiva
        const newCount = used + 1;
        
        // Actualizar en la base de datos
        await onUpdateUsed(newCount);
        
        // Actualizar fecha de último uso si es necesario
        if (onUpdateLastUsed) {
          const now = new Date();
          const formattedDate = format(now, "d 'de' MMMM, yyyy", { locale: es });
          await onUpdateLastUsed(formattedDate);
        }
        
        toast({
          title: "Contador actualizado",
          description: `Publicaciones usadas: ${newCount} de ${total}`,
        });
      } catch (error) {
        console.error('Error al actualizar contador:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el contador. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDecrease = async () => {
    if (used > 0 && !disabled && !isUpdating) {
      try {
        setIsUpdating(true);
        
        // Actualizar estado local antes para UI responsiva
        const newCount = used - 1;
        
        // Actualizar en la base de datos
        await onUpdateUsed(newCount);
        
        toast({
          title: "Contador actualizado",
          description: `Publicaciones usadas: ${newCount} de ${total}`,
        });
      } catch (error) {
        console.error('Error al actualizar contador:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el contador. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDecrease}
        disabled={used === 0 || disabled || isUpdating}
      >
        <MinusCircle className="h-4 w-4" />
      </Button>
      
      <div className="flex flex-col items-center gap-1">
        <div className="text-sm font-medium">Publicaciones Usadas</div>
        <div className="flex gap-2">
          <Badge variant="outline">{used} usadas</Badge>
          <Badge variant="secondary">{remaining} restantes</Badge>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleIncrease}
        disabled={used === total || disabled || isUpdating}
      >
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  );
};
