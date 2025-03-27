'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryItem } from '@/types/inventory.types';

interface AddInventoryItemFormProps {
  onAdd: (data: Omit<InventoryItem, 'id'>) => Promise<void>;
  onClose: () => void;
}

export default function AddInventoryItemForm({
  onAdd,
  onClose
}: AddInventoryItemFormProps) {
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: Omit<InventoryItem, 'id'>) => {
    await onAdd(data);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} placeholder="Item Name" required />
      <Input
        {...register('quantity')}
        type="number"
        placeholder="Quantity"
        required
      />
      <Button type="submit">Add Item</Button>
      <Button type="button" onClick={onClose}>
        Cancel
      </Button>
    </form>
  );
}
