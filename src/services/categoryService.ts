import { supabase } from '@/lib/supabase/config';
import type { Category } from '@/types/inventory.types';

class CategoryService {
  async getAllCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async createCategory(categoryData: Omit<Category, 'id'>): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(
    id: string,
    categoryData: Partial<Category>
  ): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}

export const categoryService = new CategoryService();
