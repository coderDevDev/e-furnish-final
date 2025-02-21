import { InventoryItem } from '@/types/inventory.types';
import { supabase } from '@/lib/supabase/config';

class InventoryService {
  async getAllInventory(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select(
        `
        *,
        product:product_id(*),
        supplier:supplier_id(*)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory:', error);
      throw new Error('Failed to fetch inventory');
    }

    return data || [];
  }

  async getInventoryItem(id: string): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .select(
        `
        *,
        product:product_id(*),
        supplier:supplier_id(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching inventory item:', error);
      throw new Error('Failed to fetch inventory item');
    }

    return data;
  }

  async createInventoryItem(
    item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<InventoryItem> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert([
          {
            ...item,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating inventory item:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Failed to create inventory item');
      }

      return data;
    } catch (error) {
      console.error('Create inventory error:', error);
      throw error;
    }
  }

  async updateInventoryItem(
    id: string,
    item: Partial<InventoryItem>
  ): Promise<InventoryItem> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update({
          ...item,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating inventory item:', error);
        throw error;
      }

      if (!data) {
        throw new Error(`No inventory item found with id: ${id}`);
      }

      return data;
    } catch (error) {
      console.error('Update inventory error:', error);
      throw error;
    }
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const { error } = await supabase.from('inventory').delete().eq('id', id);

    if (error) {
      console.error('Error deleting inventory item:', error);
      throw new Error('Failed to delete inventory item');
    }
  }

  async getInventoryHistory(itemId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('inventory_history')
      .select('*')
      .eq('inventory_id', itemId)
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory history:', error);
      throw new Error('Failed to fetch inventory history');
    }

    return data || [];
  }
}

export const inventoryService = new InventoryService();
