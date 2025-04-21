import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface ShippingSettings {
  id?: string;
  freeShippingAreas: string[];
  standardShippingFee: number;
  created_at?: string;
  updated_at?: string;
}

export const shippingService = {
  async getShippingSettings(): Promise<ShippingSettings> {
    try {
      const response = await fetch('/api/shipping/settings', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        freeShippingAreas: data.freeShippingAreas || [],
        standardShippingFee: data.standardShippingFee || 500
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
      const response = await fetch('/api/shipping/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          freeShippingAreas: settings.freeShippingAreas,
          standardShippingFee: settings.standardShippingFee
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating shipping settings:', error);
      throw error;
    }
  }
};
