import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type {
  SupplierOffer,
  OfferStatus,
  Supplier,
  SupplierOfferFormData
} from '@/types/inventory.types';

const supabase = createClientComponentClient();

interface CreateOfferData
  extends Omit<SupplierOffer, 'id' | 'updated_at' | 'status' | 'submitted_at'> {
  status: 'Pending';
  image_url?: string;
  gallery?: string[];
}

export const supplierOfferService = {
  async getAllOffers() {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) throw new Error('No authenticated session');

    // First get the supplier record
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!supplier) throw new Error('Supplier not found');

    // Then get offers using supplier.id
    const { data, error } = await supabase
      .from('supplier_offers')
      .select('*')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  async getOfferById(id: string) {
    const { data, error } = await supabase
      .from('supplier_offers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async createOffer(formData: SupplierOfferFormData) {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) throw new Error('No authenticated session');

    // First, verify supplier exists and get their ID
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, name, phone, email')
      .eq('user_id', session.user.id)
      .single();

    if (supplierError) {
      console.error('Error fetching supplier:', supplierError);
      throw new Error('Failed to fetch supplier details');
    }

    if (!supplier) throw new Error('Supplier not found');

    // Prepare the offer data
    const offerData = {
      ...formData,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      supplier_contact: supplier.phone,
      supplier_email: supplier.email,
      status: 'Pending',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Convert string values to numbers
      quantity: parseFloat(formData.quantity),
      price_per_unit: parseFloat(formData.price_per_unit),
      lead_time_days: parseInt(formData.lead_time_days),
      min_order_quantity: parseFloat(formData.min_order_quantity),
      max_order_quantity: parseFloat(formData.max_order_quantity),
      // Handle images
      image_url: formData.gallery?.[0] || null,
      gallery: formData.gallery || []
    };

    // Insert into supplier_offers table
    const { data, error } = await supabase
      .from('supplier_offers')
      .insert([offerData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(error.message);
    }

    return data;
  },

  async updateOffer(id: string, formData: SupplierOfferFormData) {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) throw new Error('No authenticated session');

    const updateData = {
      ...formData,
      updated_at: new Date().toISOString(),
      quantity: parseFloat(formData.quantity),
      price_per_unit: parseFloat(formData.price_per_unit),
      lead_time_days: parseInt(formData.lead_time_days),
      min_order_quantity: parseFloat(formData.min_order_quantity),
      max_order_quantity: parseFloat(formData.max_order_quantity),
      image_url: formData.gallery?.[0] || null,
      gallery: formData.gallery || []
    };

    const { data, error } = await supabase
      .from('supplier_offers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(error.message);
    }

    return data;
  },

  async deleteOffer(id: string) {
    const { error } = await supabase
      .from('supplier_offers')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async getAllSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) throw new Error(error.message);
    return data;
  },

  async updateOfferStatus(id: string, status: OfferStatus) {
    try {
      const { data, error } = await supabase
        .from('supplier_offers')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating offer status:', error);
      throw error;
    }
  },

  async getSupplierOffers(supplierId: string) {
    const { data, error } = await supabase
      .from('supplier_offers')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching supplier offers:', error);
      throw new Error('Failed to fetch supplier offers');
    }

    return data;
  }
};

export default supplierOfferService;
