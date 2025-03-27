import { Supplier } from '@/types/inventory.types';
import { supabase } from '@/lib/supabase/config';

class SupplierService {
  async getAllSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching suppliers:', error);
      throw new Error('Failed to fetch suppliers');
    }

    return data;
  }

  async getSupplier(id: string): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching supplier:', error);
      throw new Error('Failed to fetch supplier');
    }

    return data;
  }

  async createSupplier(
    supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([
          {
            ...supplier,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating supplier:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Failed to create supplier');
      }

      return data;
    } catch (error) {
      console.error('Create supplier error:', error);
      throw error;
    }
  }

  async updateSupplier(
    id: string,
    supplier: Partial<Supplier>
  ): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({
          ...supplier,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating supplier:', error);
        throw error;
      }

      if (!data) {
        throw new Error(`No supplier found with id: ${id}`);
      }

      return data;
    } catch (error) {
      console.error('Update supplier error:', error);
      throw error;
    }
  }

  async deleteSupplier(id: string): Promise<void> {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);

    if (error) {
      console.error('Error deleting supplier:', error);
      throw new Error('Failed to delete supplier');
    }
  }
}

export const supplierService = new SupplierService();
