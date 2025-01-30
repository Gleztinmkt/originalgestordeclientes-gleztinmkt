export interface PackagePrice {
  id: string;
  name: string;
  price: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ClientTaxInfo {
  id: string;
  client_id: string;
  tax_id_type: 'CUIT' | 'Consumidor Final';
  tax_id: string | null;
  created_at?: string;
  updated_at?: string;
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
  tax_info?: {
    tax_id_type: string;
    tax_id: string;
  };
}