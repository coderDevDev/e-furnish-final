import { Product } from '@/types/product.types';
import { supabase } from '@/lib/supabase/config';

class ProductService {
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

  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch products by category');
    }

    return data || [];
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    try {
      // Add timestamps and generate UUID for new products
      const productWithDefaults = {
        ...product,
        id: crypto.randomUUID(), // Generate UUID for new products
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productWithDefaults])
        .select()
        .single();

      if (error) {
        console.error('Create product error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Failed to create product');
      }

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
      console.log('Updating product:', { id, productData });

      const { data, error } = await supabase
        .from('products')
        .update({
          ...productData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      if (!data) {
        throw new Error(`No product found with id: ${id}`);
      }

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

  async getNewArrivals(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) {
      throw new Error('Failed to fetch new arrivals');
    }

    return data || [];
  }

  async getTopSelling(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sales_count', { ascending: false })
      .limit(4);

    if (error) {
      throw new Error('Failed to fetch top selling products');
    }

    return data || [];
  }
}

export const productService = new ProductService();
