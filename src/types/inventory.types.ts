import type { Product } from '@/types/product.types';

export interface Supplier {
  id: string; // UUID
  name: string;
  contact: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  supplier_id: string;
  quantity: number;
  min_quantity: number;
  batch_number: string;
  location?: string;
  expiration_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Join fields
  product?: Product;
  supplier?: Supplier;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  product_id: string;
  quantity: number;
  status: 'Pending' | 'Shipped' | 'Delivered';
  order_date: string;
  delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Join fields
  product?: Product;
  supplier?: Supplier;
}

export interface InventoryHistory {
  id: string;
  inventory_id: string;
  quantity: number;
  previous_quantity: number;
  change_type: 'update' | 'order' | 'adjustment';
  notes?: string;
  recorded_at: string;
  // Join fields
  inventory?: InventoryItem;
}

export type OfferStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';

export interface SupplierOffer {
  id: string;
  supplier_id: string;
  material_name: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_price: number;
  currency: string;
  description?: string;
  image_url?: string;
  availability_date: string;
  lead_time_days: number;
  supplier_notes?: string;
  status: OfferStatus;
  submitted_at: string;
  updated_at?: string;
  discount?: number;
  payment_terms?: string;
  minimum_order_qty: number;
  maximum_order_qty?: number;
  delivery_terms?: string;
  supplier_contact?: string;
  supplier_email?: string;
}
