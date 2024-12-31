import { useState } from "react";
import { MinusCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PackageCounterProps {
  total: number;
  used: number;
  onUpdateUsed: (newCount: number) => void;
}

export const PackageCounter = ({ total, used, onUpdateUsed }: PackageCounterProps) => {
  const remaining = total - used;

  return (
    <div className="flex items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onUpdateUsed(Math.max(0, used - 1))}
        disabled={used === 0}
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
        onClick={() => onUpdateUsed(Math.min(total, used + 1))}
        disabled={used === total}
      >
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  );
};