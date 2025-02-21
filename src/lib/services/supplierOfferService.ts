import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupplierOffer, OfferStatus } from '@/types/inventory.types';

const supabase = createClientComponentClient();

interface CreateOfferData
  extends Omit<SupplierOffer, 'id' | 'updated_at' | 'status' | 'submitted_at'> {
  status: 'Pending';
  image_url?: string;
  gallery?: string[];
}

export const supplierOfferService = {
  async createOffer(data: CreateOfferData): Promise<SupplierOffer> {
    try {
      const { data: offer, error } = await supabase
        .from('supplier_offers')
        .insert([
          {
            ...data,
            submitted_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  },

  async getOffers() {
    const { data, error } = await supabase
      .from('supplier_offers')
      .select(
        `
        *,
        suppliers (
          id,
          name
        )
      `
      )
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data.map(offer => ({
      ...offer,
      supplier_name: offer.suppliers?.name
    }));
  },

  async updateOffer(id: string, offer: Partial<SupplierOffer>) {
    const { data, error } = await supabase
      .from('supplier_offers')
      .update({ ...offer, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteOffer(id: string) {
    const { error } = await supabase
      .from('supplier_offers')
      .delete()
      .eq('id', id);

    if (error) throw error;
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
  }
};
