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

  async createOrder(orderData: any) {
    const supabase = createClientComponentClient();

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select('*')
        .single();

      if (error) throw error;

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
  }
};
