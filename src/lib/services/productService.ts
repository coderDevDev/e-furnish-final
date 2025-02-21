import { supabase } from '../supabase/config';
import { Product } from '@/types/product.types';

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*');

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data || [];
  },

  async getProductById(id: number): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }

    return data;
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category);

    if (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }

    return data || [];
  },

  async getNewArrivals(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) {
      console.error('Error fetching new arrivals:', error);
      throw error;
    }

    return data || [];
  },

  async getTopSelling(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sales_count', { ascending: false })
      .limit(4);

    if (error) {
      console.error('Error fetching top selling products:', error);
      throw error;
    }

    return data || [];
  }
};
