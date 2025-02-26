import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AuthResponse } from '@supabase/supabase-js';

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

    console.log({ authResponse });
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

  createOrder: async (orderData: OrderData) => {
    console.log({ orderData });
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No user found');

    // First create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: user.id,
          total_amount: orderData.total_amount,
          payment_method: orderData.payment_method,
          payment_status: orderData.payment_status,
          shipping_address: orderData.shipping_address,
          change_needed: orderData.change_needed
        }
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Then create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      customization: item.customization
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
  },

  getUserOrders: async () => {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No user found');

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(
        `
        *,
        items:order_items (
          *,
          product:products (*)
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;
    return orders;
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
      .select(
        `
        *,
        items:order_items (
          *,
          product:products (*)
        )
      `
      )
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError) throw orderError;
    return order;
  }
};
