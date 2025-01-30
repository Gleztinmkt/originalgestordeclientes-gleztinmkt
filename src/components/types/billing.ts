export interface PackagePrice {
  id: string;
  name: string;
  price: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ClientTaxInfo {
  tax_id_type: 'CUIT' | 'Consumidor Final';
  tax_id: string | null;
}

export interface Invoice {
  id: string;
  client_id: string;
  package_id: string;
  amount: number;
  original_amount: number;
  invoice_date: string;
  status: 'pending' | 'completed';
  is_split_payment: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  client?: {
    name: string;
  };
  tax_info?: ClientTaxInfo | null;
}