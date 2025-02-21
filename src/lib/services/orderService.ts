import { PurchaseOrder } from '@/types/inventory.types';
import { supabase } from '@/lib/supabase/config';

class OrderService {
  async getAllOrders(): Promise<PurchaseOrder[]> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(
        `
        *,
        product:product_id(*),
        supplier:supplier_id(*)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }

    return data || [];
  }

  async getOrder(id: string): Promise<PurchaseOrder> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(
        `
        *,
        product:product_id(*),
        supplier:supplier_id(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      throw new Error('Failed to fetch order');
    }

    return data;
  }

  async createOrder(
    order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PurchaseOrder> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert([
          {
            ...order,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Failed to create order');
      }

      return data;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  }

  async updateOrder(
    id: string,
    order: Partial<PurchaseOrder>
  ): Promise<PurchaseOrder> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          ...order,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order:', error);
        throw error;
      }

      if (!data) {
        throw new Error(`No order found with id: ${id}`);
      }

      return data;
    } catch (error) {
      console.error('Update order error:', error);
      throw error;
    }
  }

  async updateOrderStatus(
    id: string,
    status: PurchaseOrder['status']
  ): Promise<PurchaseOrder> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order status:', error);
        throw error;
      }

      if (!data) {
        throw new Error(`No order found with id: ${id}`);
      }

      return data;
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  }

  async deleteOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting order:', error);
      throw new Error('Failed to delete order');
    }
  }
}

export const orderService = new OrderService();
