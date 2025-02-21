import { Product } from '@/types/product.types';
import { supabase } from '@/lib/supabase/config';

export class ProductService {
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch products');
    }

    return data || [];
  }

  async getProduct(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error('Failed to fetch product');
    }

    return data;
  }

  async createProduct(productData: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create product');

      return data;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  }

  async updateProduct(
    id: string,
    productData: Partial<Product>
  ): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...productData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update product');

      return data;
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      throw new Error('Failed to delete product');
    }
  }
}

export const productService = new ProductService();
