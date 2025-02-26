import { Product } from '@/types/product.types';
import { supabase } from '@/lib/supabase/config';

interface GetProductsParams {
  category?: string | null;
  searchTerm?: string;
  sortBy?: string;
  page?: number;
  itemsPerPage?: number;
  minPrice?: number;
  maxPrice?: number;
}

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
    //console.log('Dexxx cat');
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
      //console.log('Updating product:', { id, productData });

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

  async getProducts({
    category,
    searchTerm,
    sortBy = 'newest',
    page = 1,
    itemsPerPage = 12,
    minPrice,
    maxPrice
  }: GetProductsParams) {
    try {
      let query = supabase.from('products').select('*', { count: 'exact' });

      //console.log('by category', category);
      // Apply category filter
      if (category) {
        query = query.ilike('category', `%${category}%`);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      // Apply price filter
      if (typeof minPrice === 'number') {
        query = query.gte('price', minPrice);
      }
      if (typeof maxPrice === 'number') {
        query = query.lte('price', maxPrice);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const start = (page - 1) * itemsPerPage;
      query = query.range(start, start + itemsPerPage - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      return {
        products: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async getMaxPrice(): Promise<number> {
    const { data, error } = await supabase
      .from('products')
      .select('price')
      .order('price', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data?.price || 250000; // Default to 250000 if no products found
  }
}

export const productService = new ProductService();
