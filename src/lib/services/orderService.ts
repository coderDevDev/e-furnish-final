import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { PurchaseOrder } from '@/types/inventory.types';

const supabase = createClientComponentClient();

export const orderService = {
  async getAllOrders() {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(
        `
        *,
        suppliers:supplier_id (
          id,
          name
        ),
        products:product_id (
          id,
          title
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createOrder(
    orderData: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .insert([orderData])
      .select(
        `
        *,
        suppliers:supplier_id (
          id,
          name
        ),
        products:product_id (
          id,
          title
        )
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  async updateOrderStatus(id: string, status: PurchaseOrder['status']) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('id', id)
      .select(
        `
        *,
        suppliers:supplier_id (
          id,
          name
        ),
        products:product_id (
          id,
          title
        )
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  async deleteOrder(id: string) {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
