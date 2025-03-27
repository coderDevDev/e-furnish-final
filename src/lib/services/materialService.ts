import { Material } from '@/types/inventory.types';
import { supabase } from '@/lib/supabase/config';

export const materialService = {
  getAllMaterials: async (): Promise<Material[]> => {
    const { data, error } = await supabase
      .from('materials') // Adjust the table name as necessary
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data as Material[];
  },

  addMaterial: async (material: Omit<Material, 'id'>): Promise<void> => {
    const { error } = await supabase
      .from('materials') // Adjust the table name as necessary
      .insert(material);

    if (error) {
      throw new Error(error.message);
    }
  }

  // Add more functions as needed (e.g., updateMaterial, deleteMaterial)
};
