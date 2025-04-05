import type { Product } from '@/types/product.types';
import { z } from 'zod';

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

export interface SupplierOffer
  extends Omit<
    SupplierOfferFormData,
    | 'quantity'
    | 'price_per_unit'
    | 'lead_time_days'
    | 'min_order_quantity'
    | 'max_order_quantity'
  > {
  id: string;
  quantity: number;
  price_per_unit: number;
  lead_time_days: number;
  min_order_quantity: number;
  max_order_quantity: number;
  status: OfferStatus;
  submitted_at: string;
  updated_at: string;
  image_url?: string;
  gallery?: string[];
}

export interface Material {
  id: number;
  name: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Payment {
  id: number;
  order_id: string; // Reference to the order
  amount: number;
  payment_date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  created_at: string;
  updated_at: string;
}

export const supplierOfferSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  supplier_name: z.string().min(1, 'Supplier name is required'),
  supplier_contact: z.string().min(1, 'Contact number is required'),
  supplier_email: z.string().email('Invalid email address'),
  material_name: z.string().min(1, 'Material name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  unit: z.string().min(1, 'Unit is required'),
  price_per_unit: z.string().min(1, 'Price is required'),
  currency: z.string().min(1, 'Currency is required'),
  availability_date: z.string().min(1, 'Availability date is required'),
  lead_time_days: z.string().min(1, 'Lead time is required'),
  min_order_quantity: z.string().min(1, 'Minimum order quantity is required'),
  max_order_quantity: z.string().min(1, 'Maximum order quantity is required'),
  payment_terms: z.string().min(1, 'Payment terms are required'),
  delivery_terms: z.string().min(1, 'Delivery terms are required'),
  supplier_notes: z.string().optional(),
  image_url: z.string().optional(),
  gallery: z.array(z.string()).optional()
});

export type SupplierOfferFormData = z.infer<typeof supplierOfferSchema>;

export interface TempImage {
  file: File;
  preview: string;
}

export interface OwnerOrder {
  id: string;
  supplier_id: string;
  owner_id: string;
  supplier_offer_id: string;
  furniture_type: string;
  furniture_details: {
    dimensions: {
      width: number;
      height: number;
      depth: number;
    };
    color: string;
    style: string;
    additional_details?: string;
  };
  quantity_needed: number;
  delivery_address: string;
  target_completion_date: string;
  status: 'Pending' | 'Accepted' | 'In Progress' | 'Completed' | 'Rejected';
  created_at: string;
  updated_at: string;
  // Relations
  supplier_offer?: SupplierOffer;
  owner?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export const ownerOrderSchema = z.object({
  supplier_offer_id: z.string(),
  furniture_type: z.string().min(1, 'Furniture type is required'),
  furniture_details: z.object({
    dimensions: z.object({
      width: z.number().min(0),
      height: z.number().min(0),
      depth: z.number().min(0)
    }),
    color: z.string().min(1, 'Color is required'),
    style: z.string().min(1, 'Style is required'),
    additional_details: z.string().optional()
  }),
  quantity_needed: z.number().min(1, 'Quantity is required'),
  delivery_address: z.string().min(1, 'Delivery address is required'),
  target_completion_date: z
    .string()
    .min(1, 'Target completion date is required')
});

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
