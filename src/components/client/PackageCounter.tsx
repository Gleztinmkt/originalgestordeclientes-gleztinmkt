
import { MinusCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PackageCounterProps {
  total: number;
  used: number;
  onUpdateUsed: (newCount: number) => void;
  onUpdateLastUsed?: (date: string) => void;
  disabled?: boolean;
}

export const PackageCounter = ({ total, used, onUpdateUsed, onUpdateLastUsed, disabled }: PackageCounterProps) => {
  const remaining = total - used;

  const handleIncrease = () => {
    if (used < total) {
      onUpdateUsed(used + 1);
      if (onUpdateLastUsed) {
        const now = new Date();
        const formattedDate = format(now, "d 'de' MMMM, yyyy", { locale: es });
        onUpdateLastUsed(formattedDate);
      }
    }
  };

  const handleDecrease = () => {
    if (used > 0) {
      onUpdateUsed(used - 1);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDecrease}
        disabled={used === 0 || disabled}
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
        disabled={used === total || disabled}
      >
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  );
};
