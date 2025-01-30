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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Invoice } from "@/components/types/billing";

export const InvoiceManager = () => {
  const [filters, setFilters] = useState({
    client: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });

  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          client:clients(name),
          tax_info:client_tax_info(tax_id_type, tax_id)
        `)
        .is('deleted_at', null);

      if (filters.client) {
        query = query.ilike('clients.name', `%${filters.client}%`);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.dateFrom) {
        query = query.gte('invoice_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('invoice_date', filters.dateTo);
      }

      const { data, error } = await query.order('invoice_date', { ascending: false });
      
      if (error) {
        throw error;
      }

      return data.map((invoice: any) => ({
        ...invoice,
        tax_info: Array.isArray(invoice.tax_info) && invoice.tax_info.length > 0 
          ? {
              tax_id_type: invoice.tax_info[0].tax_id_type,
              tax_id: invoice.tax_info[0].tax_id
            }
          : null
      })) as Invoice[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Invoice> }) => {
      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Factura actualizada",
        description: "La factura ha sido actualizada exitosamente.",
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

  const toggleSplitPayment = async (invoice: Invoice) => {
    const newAmount = invoice.is_split_payment
      ? invoice.amount / 1.025
      : invoice.amount * 1.025;

    updateMutation.mutate({
      id: invoice.id,
      updates: {
        is_split_payment: !invoice.is_split_payment,
        amount: Number(newAmount.toFixed(2)),
      },
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Gestión de Facturas</h3>

      <div className="grid grid-cols-4 gap-4">
        <Input
          placeholder="Buscar cliente"
          value={filters.client}
          onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
        />
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="completed">Facturado</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>CUIT/CF</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Dos Pagos</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice: Invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.client?.name}</TableCell>
              <TableCell>
                {invoice.tax_info?.tax_id || 'Consumidor Final'}
              </TableCell>
              <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={invoice.amount}
                  onChange={(e) => {
                    updateMutation.mutate({
                      id: invoice.id,
                      updates: { amount: parseFloat(e.target.value) },
                    });
                  }}
                  className="w-24"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={invoice.status}
                  onValueChange={(value) => {
                    updateMutation.mutate({
                      id: invoice.id,
                      updates: { status: value as 'pending' | 'completed' },
                    });
                  }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="completed">Facturado</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Switch
                  checked={invoice.is_split_payment}
                  onCheckedChange={() => toggleSplitPayment(invoice)}
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateMutation.mutate({
                      id: invoice.id,
                      updates: { status: invoice.status === 'pending' ? 'completed' : 'pending' },
                    });
                  }}>
                  {invoice.status === 'pending' ? 'Marcar Facturado' : 'Marcar Pendiente'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};