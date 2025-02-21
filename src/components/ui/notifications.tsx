import { toast } from 'sonner';

export const notify = {
  lowStock: (itemName: string, quantity: number, minQuantity: number) => {
    toast.warning(`Low Stock Alert`, {
      description: `${itemName} is running low (${quantity}/${minQuantity} units)`
    });
  },

  criticalStock: (itemName: string, quantity: number) => {
    toast.error(`Critical Stock Alert`, {
      description: `${itemName} is critically low (${quantity} units remaining)`
    });
  },

  stockUpdate: (itemName: string, newQuantity: number) => {
    toast.info(`Stock Updated`, {
      description: `${itemName} quantity updated to ${newQuantity} units`
    });
  }
};
