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
  }
};
