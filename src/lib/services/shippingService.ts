import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface ShippingSettings {
  id?: string;
  freeShippingAreas: string[];
  standardShippingFee: number;
  created_at?: string;
  updated_at?: string;
}

const supabase = createClientComponentClient();

export const shippingService = {
  async getShippingSettings(): Promise<ShippingSettings> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'shipping_settings')
        .single();

      if (error) throw error;

      return {
        freeShippingAreas: data?.value?.freeShippingAreas || [
          'Cabusao',
          'Del Gallego',
          'Lupi',
          'Ragay',
          'Sipocot'
        ],
        standardShippingFee: data?.value?.standardShippingFee || 500
      };
    } catch (error) {
      console.error('Error in getShippingSettings:', error);
      // Return default settings if there's an exception
      return {
        freeShippingAreas: [
          'Cabusao',
          'Del Gallego',
          'Lupi',
          'Ragay',
          'Sipocot'
        ],
        standardShippingFee: 500
      };
    }
  },

  async updateShippingSettings(settings: ShippingSettings): Promise<void> {
    try {
      const { error } = await supabase.from('settings').upsert(
        {
          key: 'shipping_settings',
          value: {
            freeShippingAreas: settings.freeShippingAreas,
            standardShippingFee: settings.standardShippingFee
          },
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'key'
        }
      );

      if (error) throw error;
    } catch (error) {
      console.error('Error updating shipping settings:', error);
      throw error;
    }
  },

  calculateShippingFee(
    municipality: string,
    freeShippingAreas: string[]
  ): number {
    // Check if municipality is in free shipping areas
    if (freeShippingAreas.includes(municipality)) {
      return 0;
    }
    // Return standard shipping fee
    return 500;
  }
};
