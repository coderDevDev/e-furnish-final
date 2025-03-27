import { Payment } from '@/types/inventory.types';
import { supabase } from '@/lib/supabase/config';

export const paymentService = {
  getPayments: async (): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments') // Adjust the table name as necessary
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data as Payment[];
  }

  // Add more functions as needed (e.g., addPayment, updatePayment)
};
