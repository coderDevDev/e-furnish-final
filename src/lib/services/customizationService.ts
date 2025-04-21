import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type CustomizationField = {
  fieldName: string;
  fieldType: string;
  enabled: boolean;
  options?: any;
  pricingImpact?: any;
};

export const customizationService = {
  async getProductCustomizationOptions(
    productId: string
  ): Promise<CustomizationField[]> {
    const supabase = createClientComponentClient();

    try {
      const { data, error } = await supabase
        .from('product_customization_options')
        .select('*')
        .eq('product_id', productId);

      if (error) {
        console.error('Error fetching customization options:', error);
        return [];
      }

      return data.map(item => ({
        fieldName: item.field_name,
        fieldType: item.field_type,
        enabled: item.enabled,
        options: item.options,
        pricingImpact: item.pricing_impact
      }));
    } catch (error) {
      console.error('Error in getProductCustomizationOptions:', error);
      return [];
    }
  },

  async saveProductCustomizationOptions(
    productId: string,
    options: CustomizationField[]
  ): Promise<boolean> {
    const supabase = createClientComponentClient();

    try {
      // First, delete existing options for this product
      const { error: deleteError } = await supabase
        .from('product_customization_options')
        .delete()
        .eq('product_id', productId);

      if (deleteError) {
        console.error(
          'Error deleting existing customization options:',
          deleteError
        );
        return false;
      }

      // If there are no options to save, we're done
      if (!options.length) {
        return true;
      }

      // Then insert new options
      const { error: insertError } = await supabase
        .from('product_customization_options')
        .insert(
          options.map(option => ({
            product_id: productId,
            field_name: option.fieldName,
            field_type: option.fieldType,
            enabled: option.enabled,
            options: option.options || null,
            pricing_impact: option.pricingImpact || null
          }))
        );

      if (insertError) {
        console.error('Error inserting customization options:', insertError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveProductCustomizationOptions:', error);
      return false;
    }
  },

  // Add method to save pricing configuration
  async saveProductPricingConfig(
    productId: string,
    pricingConfig: {
      calculationMethod: string;
      showBreakdown: boolean;
    }
  ): Promise<boolean> {
    const supabase = createClientComponentClient();

    try {
      const { error } = await supabase.from('product_pricing_config').upsert(
        {
          product_id: productId,
          calculation_method: pricingConfig.calculationMethod,
          show_breakdown: pricingConfig.showBreakdown,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'product_id' }
      );

      if (error) {
        console.error('Error saving pricing configuration:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveProductPricingConfig:', error);
      return false;
    }
  }
};
