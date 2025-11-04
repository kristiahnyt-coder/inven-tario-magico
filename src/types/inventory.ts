export interface Article {
  id: string;
  code: string;
  name: string;
  brand: string;
  units: number;
  price: number;
  reference: string;
  sectionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  articles: Article[];
}

export interface RecentActivity {
  id: string;
  articleCode: string;
  articleName: string;
  action: 'created' | 'updated' | 'deleted';
  timestamp: string;
  details?: string;
}

export interface Customer {
  id: string;
  name: string;
  nit: string;
  address: string;
  phone: string;
  email?: string;
}

export interface InvoiceItem {
  articleId: string;
  articleCode: string;
  articleName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  iva: number;
  total: number;
  status: 'draft' | 'confirmed' | 'cancelled';
  createdAt: string;
  confirmedAt?: string;
  resolucionDian?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  iva: number;
  total: number;
  status: 'active' | 'converted' | 'expired';
  validUntil: string;
  createdAt: string;
  convertedToInvoiceId?: string;
}

export interface InventoryState {
  articles: Article[];
  sections: Section[];
  recentActivities: RecentActivity[];
  invoices: Invoice[];
  quotes: Quote[];
  customers: Customer[];
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};