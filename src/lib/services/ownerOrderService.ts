import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { OwnerOrder, SupplierOffer } from '@/types/inventory.types';

const supabase = createClientComponentClient();

export const ownerOrderService = {
  async getSupplierOrders() {
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

    // Get orders with related material offer details
    const { data, error } = await supabase
      .from('owner_orders')
      .select(
        `
        *,
        supplier_offer:supplier_offers(
          id,
          material_name,
          description,
          quantity,
          price_per_unit,
          unit,
          image_url,
          gallery
        ),
        owner:profiles(
          id,
          full_name,
          email,
          phone
        )
      `
      )
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }

    return data;
  },

  async getOrderById(id: string) {
    const { data, error } = await supabase
      .from('owner_orders')
      .select(
        `
        *,
        supplier_offer:supplier_offers(*),
        owner:profiles(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      throw new Error('Failed to fetch order');
    }

    return data;
  },

  async updateOrderStatus(id: string, status: OwnerOrder['status']) {
    const { data, error } = await supabase
      .from('owner_orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }

    return data;
  },

  async getOrdersByMaterialOffer(offerId: string) {
    const { data, error } = await supabase
      .from('owner_orders')
      .select(
        `
        *,
        owner:profiles(
          id,
          full_name,
          email,
          phone
        )
      `
      )
      .eq('supplier_offer_id', offerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }

    return data;
  },

  // Create a test order
  async createTestOrder(
    orderData: Omit<OwnerOrder, 'id' | 'created_at' | 'updated_at'>
  ) {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) throw new Error('No authenticated session');

    const { data, error } = await supabase
      .from('owner_orders')
      .insert({
        ...orderData,
        status: 'Pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test order:', error);
      throw new Error('Failed to create test order');
    }

    return data;
  },

  // Get a sample order data for testing
  getSampleOrderData(supplierId: string, supplierOfferId: string) {
    return {
      owner_id: 'test-owner-id',
      supplier_id: supplierId,
      supplier_offer_id: supplierOfferId,
      furniture_type: '',
      furniture_details: {
        dimensions: {
          width: 0,
          height: 0,
          depth: 0
        },
        color: '',
        style: '',
        additional_details: ''
      },
      quantity_needed: 1,
      delivery_address: '',
      target_completion_date: '',
      status: 'Pending' as const,
      owner_details: {
        full_name: '',
        email: '',
        phone: ''
      }
    };
  }
};

export default ownerOrderService;
