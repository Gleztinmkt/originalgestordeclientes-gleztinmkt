import { Package, Edit, MoreVertical, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageCounter } from "./PackageCounter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddPackageForm, PackageFormValues } from "./AddPackageForm";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface ClientPackageProps {
  packageName: string;
  totalPublications: number;
  usedPublications: number;
  month: string;
  paid: boolean;
  onUpdateUsed: (newCount: number) => void;
  onUpdatePaid: (paid: boolean) => void;
  onEditPackage: (values: PackageFormValues) => void;
  onDeletePackage?: () => void;
}

export const ClientPackage = ({
  packageName,
  totalPublications,
  usedPublications,
  month,
  paid,
  onUpdateUsed,
  onUpdatePaid,
  onEditPackage,
  onDeletePackage,
}: ClientPackageProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditSubmit = (values: PackageFormValues) => {
    onEditPackage(values);
    setIsEditDialogOpen(false);
    toast({
      title: "Paquete actualizado",
      description: "El paquete ha sido actualizado correctamente.",
    });
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Package className="h-5 w-5" />
          {packageName}
        </CardTitle>
        <div className="flex items-center gap-4">
          <Badge>{month}</Badge>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {paid ? "Pagado" : "Pendiente"}
            </span>
            <Switch checked={paid} onCheckedChange={onUpdatePaid} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar paquete
              </DropdownMenuItem>
              {onDeletePackage && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    onDeletePackage();
                    toast({
                      title: "Paquete eliminado",
                      description: "El paquete ha sido eliminado correctamente.",
                    });
                  }}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Eliminar paquete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <PackageCounter
          total={totalPublications}
          used={usedPublications}
          onUpdateUsed={onUpdateUsed}
        />
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Paquete</DialogTitle>
          </DialogHeader>
          <AddPackageForm
            onSubmit={handleEditSubmit}
            defaultValues={{
              name: packageName,
              totalPublications: totalPublications.toString(),
              month: month,
              paid: paid,
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};