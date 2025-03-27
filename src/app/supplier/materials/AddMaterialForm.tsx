'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Material } from '@/types/inventory.types';

interface AddMaterialFormProps {
  onAdd: (material: Omit<Material, 'id'>) => Promise<void>;
  onClose: () => void;
}

const AddMaterialForm: React.FC<AddMaterialFormProps> = ({
  onAdd,
  onClose
}) => {
  const [materialName, setMaterialName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newMaterial = {
      material_name: materialName,
      category,
      price,
      quantity,
      image_url: image
    };
    await onAdd(newMaterial);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Add New Material</h2>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Material Name"
            value={materialName}
            onChange={e => setMaterialName(e.target.value)}
            className="mb-4"
          />
          <Select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="mb-4">
            <option value="">Select Category</option>
            <option value="raw">Raw Material</option>
            <option value="finished">Finished Product</option>
          </Select>
          <Input
            type="number"
            placeholder="Price"
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="mb-4"
          />
          <Input
            type="number"
            placeholder="Quantity Available"
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="mb-4"
          />
          <Input
            type="file"
            accept="image/*"
            onChange={e => setImage(e.target.files?.[0] || null)}
            className="mb-4"
          />
          <div className="flex justify-end">
            <Button type="button" onClick={onClose} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" className="bg-green-500 text-white">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMaterialForm;
