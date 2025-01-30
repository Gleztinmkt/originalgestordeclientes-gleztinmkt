import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PackagePrice {
  id: string;
  name: string;
  price: number;
}

export const PackagePriceManager = () => {
  const [newPackage, setNewPackage] = useState({ name: "", price: "" });
  const queryClient = useQueryClient();

  const { data: prices = [] } = useQuery({
    queryKey: ['packagePrices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('package_prices')
        .select('*')
        .is('deleted_at', null)
        .order('created_at');
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (packageData: { name: string; price: number }) => {
      const { error } = await supabase
        .from('package_prices')
        .insert([packageData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packagePrices'] });
      setNewPackage({ name: "", price: "" });
      toast({
        title: "Precio agregado",
        description: "El precio del paquete ha sido agregado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!newPackage.name || !newPackage.price) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      });
      return;
    }

    addMutation.mutate({
      name: newPackage.name,
      price: parseFloat(newPackage.price),
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Precios de Paquetes</h3>
      
      <div className="flex gap-4">
        <Input
          placeholder="Nombre del paquete"
          value={newPackage.name}
          onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
        />
        <Input
          type="number"
          placeholder="Precio"
          value={newPackage.price}
          onChange={(e) => setNewPackage(prev => ({ ...prev, price: e.target.value }))}
        />
        <Button onClick={handleSubmit} disabled={addMutation.isPending}>
          Agregar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paquete</TableHead>
            <TableHead>Precio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prices.map((price: PackagePrice) => (
            <TableRow key={price.id}>
              <TableCell>{price.name}</TableCell>
              <TableCell>${price.price.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};