import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AuthResponse } from '@supabase/supabase-js';

const supabase = createClientComponentClient();

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  returned: number;
}

export interface OrderSummary {
  id: string;
  created_at: string;
  user_id: string;
  user_details: {
    full_name: string;
    email: string;
    phone: string;
  };
  total_amount: number;
  payment_status: string;
  payment_method: string;
  status: string;
  shipping_address: any;
  items: Array<{
    product: {
      title: string;
      price: number;
    };
    quantity: number;
    customization?: any;
  }>;
}

class CustomerOrderService {
  async getOrderStats(): Promise<OrderStats> {
    try {
      const { data: orders, error } = await supabase.from('orders').select('*'); // Select all columns to ensure we get the data

      if (error) {
        console.error('Error fetching order stats:', error);
        throw error;
      }

      //console.log('Orders data:', orders);

      const stats = orders?.reduce(
        (acc, order) => {
          acc.total++;
          const status = order.status?.toLowerCase() || 'pending';
          if (acc.hasOwnProperty(status)) {
            acc[status as keyof Omit<OrderStats, 'total'>]++;
          }
          return acc;
        },
        {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          cancelled: 0,
          returned: 0
        }
      ) || {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
        returned: 0
      };

      return stats;
    } catch (error) {
      console.error('Error in getOrderStats:', error);
      throw error;
    }
  }

  async getOrders(filters?: {
    status?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<OrderSummary[]> {
    try {
      // Use explicit foreign key constraints to avoid ambiguity and a deeper nesting level
      let query = supabase.from('orders').select(`
        id,
        created_at,
        user_id,
        total_amount,
        payment_status,
        payment_method,
        status,
        shipping_address,
        shipping_fee,
        profiles!orders_user_id_fkey(
          id, 
          full_name, 
          email, 
          phone
        ),
        order_items:order_items(
          id,
          quantity,
          price,
          customization,
          product_id,
          products:products(
            id, 
            title, 
            price, 
            srcurl
          )
        )
      `);

      // Apply filters if provided
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters?.search) {
        query = query.or(
          `profiles.full_name.ilike.%${filters.search}%,id.eq.${filters.search}`
        );
      }

      const { data, error } = await query.order('created_at', {
        ascending: false
      });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      // Debug output
      console.log('First order:', data?.[0]?.id);
      console.log('Order items:', data?.[0]?.order_items?.length);
      console.log(
        'First order item product:',
        data?.[0]?.order_items?.[0]?.products
      );

      return data || [];
    } catch (error) {
      console.error('Error in getOrders:', error);
      throw error;
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    reason?: string
  ): Promise<void> {
    try {
      // First get the order details before updating
      const { data: orderDetails } = await supabase
        .from('orders')
        .select(
          `
          *,
          profiles!orders_user_id_fkey (
            full_name,
            email,
            phone
          ),
          order_items (
            id,
            quantity,
            customization,
            products!order_items_product_id_fkey (
              id,
              title,
              price,
              srcurl
            )
          )
        `
        )
        .eq('id', orderId)
        .single();

      // Update the order status (keeping original functionality)
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          status_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // After successful update, send email notification
      if (orderDetails) {
        // Prepare email data
        const emailData = {
          order: {
            id: orderDetails.id,
            total_amount: orderDetails.total_amount,
            status,
            status_reason: reason,
            payment_method: orderDetails.payment_method,
            payment_status: orderDetails.payment_status,
            created_at: orderDetails.created_at,
            shipping_address: orderDetails.shipping_address
          },
          userProfile: orderDetails.profiles,
          orderSummary: orderDetails.order_items.map(item => ({
            id: item.id,
            name: item.products.title,
            quantity: item.quantity,
            price: item.products.price,
            image: item.products.srcUrl,
            customization: item.customization
          })),
          status,
          statusUpdateDate: new Date().toISOString()
        };

        // Send status update email
        try {
          const response = await fetch('/api/send-order-status-update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
          });

          if (!response.ok) {
            console.error('Failed to send order status update email');
          }
        } catch (emailError) {
          // Log email error but don't throw it to maintain original functionality
          console.error('Error sending status update email:', emailError);
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error; // Maintain original error handling
    }
  }

  async getOrderDetails(orderId: string): Promise<OrderSummary> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          profiles!orders_user_id_fkey (
            full_name,
            email,
            phone
          ),
          order_items (
            quantity,
            customization,
            products!order_items_product_id_fkey (
              title,
              price
            )
          )
        `
        )
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order details:', error);
        throw error;
      }

      console.log('Order details:', data);

      return data;
    } catch (error) {
      console.error('Error in getOrderDetails:', error);
      throw error;
    }
  }

  async getOrderAnalytics(period: 'day' | 'week' | 'month' = 'month') {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total_amount, status')
      .gte(
        'created_at',
        new Date(
          Date.now() -
            (period === 'day' ? 1 : period === 'week' ? 7 : 30) *
              24 *
              60 *
              60 *
              1000
        ).toISOString()
      );

    if (error) throw error;
    return data;
  }
}

export const customerOrderService = new CustomerOrderService();
