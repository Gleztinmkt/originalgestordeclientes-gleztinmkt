import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Client } from "@/components/types/client";
import { PackageCounter } from "@/components/client/PackageCounter";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PackageSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
  onConfirm: (packageId: string, newUsedCount: number, lastUpdate: string) => void;
}

export const PackageSelectionDialog = ({
  open,
  onOpenChange,
  client,
  onConfirm,
}: PackageSelectionDialogProps) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [updatedCounts, setUpdatedCounts] = useState<Record<string, number>>({});
  const [lastUpdateDates, setLastUpdateDates] = useState<Record<string, string>>({});

  const handleConfirm = () => {
    // Siempre usar la fecha actual cuando se confirma
    const lastUpdate = format(new Date(), "d 'de' MMMM, yyyy", { locale: es });
    
    if (selectedPackageId) {
      const newCount = updatedCounts[selectedPackageId];
      onConfirm(selectedPackageId, newCount, lastUpdate);
    } else {
      // Si no se seleccionó ningún paquete, confirmar sin actualizar paquetes
      onConfirm("", 0, lastUpdate);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedPackageId(null);
    setUpdatedCounts({});
    setLastUpdateDates({});
    onOpenChange(false);
  };

  const handleUpdateUsed = (packageId: string, newCount: number) => {
    setSelectedPackageId(packageId);
    setUpdatedCounts(prev => ({
      ...prev,
      [packageId]: newCount
    }));
  };

  const handleUpdateLastUsed = (packageId: string, date: string) => {
    setLastUpdateDates(prev => ({
      ...prev,
      [packageId]: date
    }));
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Descontar publicación del paquete</DialogTitle>
          <DialogDescription>
            Selecciona el paquete de {client.name} del cual deseas descontar esta publicación.
            Puedes modificar el contador o saltar este paso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {client.packages && client.packages.length > 0 ? (
            client.packages.map((pkg) => {
              const currentUsed = updatedCounts[pkg.id] ?? pkg.usedPublications;
              const isSelected = selectedPackageId === pkg.id;
              
              return (
                <div
                  key={pkg.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{pkg.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Mes: {pkg.month}
                      </p>
                    </div>
                    <Badge variant={pkg.paid ? "default" : "destructive"}>
                      {pkg.paid ? "Pagado" : "Pendiente"}
                    </Badge>
                  </div>

                  <PackageCounter
                    total={pkg.totalPublications}
                    used={currentUsed}
                    onUpdateUsed={(newCount) => handleUpdateUsed(pkg.id, newCount)}
                    onUpdateLastUsed={(date) => handleUpdateLastUsed(pkg.id, date)}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Este cliente no tiene paquetes disponibles
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            {selectedPackageId ? "Confirmar y publicar" : "Publicar sin descontar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
