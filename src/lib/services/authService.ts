import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AuthResponse } from '@supabase/supabase-js';
import { format, addBusinessDays } from 'date-fns';

const supabase = createClientComponentClient();

export interface RegisterData {
  email: string;
  password: string;
  role: 'user' | 'supplier' | 'admin';
  metadata: {
    full_name: string;
    phone: string;
    username?: string;
    date_of_birth?: string;
    gender?: string;
    address: {
      region_id: string;
      region_name: string;
      province_id: string;
      province_name: string;
      city_id: string;
      city_name: string;
      barangay_id: string;
      barangay_name: string;
      street: string;
      zip_code: string;
    };
  };
}

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  updated_at: string;
}

interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  customization?: {
    dimensions: {
      size: number;
    };
    addons: Array<{
      id: string;
      name: string;
      category: string;
      unit: string;
      quantity: number;
      price: number;
    }>;
    totalCustomizationCost: number;
  };
}

interface OrderData {
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  payment_method: 'cod' | 'paypal';
  payment_status: 'pending' | 'completed';
  shipping_address: {
    street: string;
    region_id: string;
    region_name: string;
    province_id: string;
    province_name: string;
    city_id: string;
    city_name: string;
    barangay_id: string;
    barangay_name: string;
    zip_code: string;
  };
  change_needed?: number;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, role, metadata } = data;

    // First create the user and wait for confirmation
    const authResponse = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          ...metadata
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    //console.log({ authResponse });
    if (authResponse.error) throw authResponse.error;

    // Only create profile if user was created successfully
    if (authResponse.data?.user?.id) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: authResponse.data.user.id,
          role,
          full_name: metadata.full_name,
          phone: metadata.phone,
          username: metadata.username,
          date_of_birth: metadata.date_of_birth,
          gender: metadata.gender,
          address: metadata.address,
          email: email
        }
      ]);

      if (profileError) throw profileError;
    }

    return authResponse;
  },

  getCurrentUser: async () => {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  getUserProfile: async () => {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    return {
      user,
      profile
    };
  },

  updateUserProfile: async (profileData: Partial<UserProfile>) => {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No user found');

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ...profileData,
      updated_at: new Date().toISOString()
    });

    if (error) throw error;
  },

  async createOrder(orderData: OrderData) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      // After successful order creation, send confirmation email
      if (data) {
        try {
          await this.sendOrderConfirmationEmail(data.id);
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail the order creation if email sending fails
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating order:', error);
      return { data: null, error };
    }
  },

  getUserOrders: async () => {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No user found');

    // First get the orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;
    if (!orders) return [];

    // Process each order to enhance with product details
    const enhancedOrders = await Promise.all(
      orders.map(async order => {
        // Parse order items if they exist
        const orderItems = order.items || [];

        // Get all product IDs from the order
        const productIds = orderItems.map(item => item.product_id);

        // Fetch product details for these IDs
        const { data: products } = await supabase
          .from('products')
          .select('id, title, srcurl, gallery, price, category')
          .in('id', productIds);

        // Map products to items
        const itemsWithProducts = orderItems.map(item => {
          const product = products?.find(p => p.id === item.product_id) || {};
          return {
            ...item,
            product: {
              id: item.product_id,
              title: product.title || 'Product',
              name: product.title || 'Product',
              srcurl: product.srcurl || null,
              gallery: product.gallery || [],
              price: item.price,
              customization: item.customization || null
            }
          };
        });

        return {
          ...order,
          items: itemsWithProducts
        };
      })
    );

    return enhancedOrders;
  },

  getOrderDetails: async (orderId: string) => {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No user found');

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');

    // Parse order items if they exist
    const orderItems = order.items || [];

    // Get all product IDs from the order
    const productIds = orderItems.map(item => item.product_id);

    // Fetch product details for these IDs
    const { data: products } = await supabase
      .from('products')
      .select('id, title, srcurl, gallery, price, category, description')
      .in('id', productIds);

    // Map products to items
    const itemsWithProducts = orderItems.map(item => {
      const product = products?.find(p => p.id === item.product_id) || {};
      return {
        ...item,
        product: {
          id: item.product_id,
          title: product.title || 'Product',
          name: product.title || 'Product',
          srcurl: product.srcurl || null,
          gallery: product.gallery || [],
          price: item.price,
          category: product.category || '',
          description: product.description || '',
          customization: item.customization || null
        }
      };
    });

    return {
      ...order,
      items: itemsWithProducts
    };
  },

  cancelOrder: async (orderId: string) => {
    try {
      // First, get the order with its items to know which products to update
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Update stock for each product in the order
      for (const item of order.order_items) {
        // Get current product data
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('stock, sales_count')
          .eq('id', item.product_id)
          .single();

        if (productError) {
          console.error('Error fetching product data:', productError);
          continue; // Skip to next item if there's an error
        }

        // Calculate restored stock and decreased sales count
        const restoredStock = (productData.stock || 0) + item.quantity;
        const updatedSalesCount = Math.max(
          0,
          (parseInt(productData.sales_count) || 0) - parseInt(item.quantity)
        );

        // Update the product inventory
        const { error: updateError } = await supabase
          .from('products')
          .update({
            stock: restoredStock,
            sales_count: updatedSalesCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_id);

        if (updateError) {
          console.error('Error restoring product inventory:', updateError);
        }
      }

      // Update the order status to 'cancelled' in the database
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', payment_status: 'cancelled' })
        .eq('id', orderId)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },

  async sendOrderConfirmationEmail(orderId: string): Promise<void> {
    try {
      // Get order details first
      const orderDetails = await this.getOrderDetails(orderId);
      if (!orderDetails) throw new Error('Order not found');

      // Get user details
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Format order items for email
      const orderSummary = orderDetails.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        image: item.product.srcurl || item.product.gallery?.[0],
        customization: item.customization
      }));

      // Calculate estimated delivery date (e.g., 7 business days from now)
      const estimatedDeliveryDate = addBusinessDays(
        new Date(),
        3
      ).toISOString();

      // Call the API route to send the email
      const response = await fetch('/api/send-order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: orderDetails,
          userProfile: {
            ...profile,
            email: user.email
          },
          orderSummary,
          shippingAddress: orderDetails.shipping_address,
          estimatedDeliveryDate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      throw error;
    }
  }
};
