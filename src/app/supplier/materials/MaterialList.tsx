'use client';

import { Material } from '@/types/inventory.types';
import { Button } from '@/components/ui/button';
import { IconEdit, IconTrash } from 'lucide-react';

interface MaterialListProps {
  materials: Material[];
  onEdit: (material: Material) => void;
  onDelete: (id: number) => void;
}

const MaterialList: React.FC<MaterialListProps> = ({
  materials,
  onEdit,
  onDelete
}) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {materials.map(material => (
        <div
          key={material.id}
          className="border rounded-lg p-4 shadow-md flex justify-between items-center">
          <div className="flex items-center">
            <img
              src={material.image_url}
              alt={material.material_name}
              className="w-16 h-16 rounded-md mr-4"
            />
            <div>
              <h3 className="text-lg font-semibold">
                {material.material_name}
              </h3>
              <p className="text-gray-600">{material.description}</p>
              <p className="text-gray-800">Price: ${material.price}</p>
              <p className="text-gray-800">
                Quantity Available: {material.quantity}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => onEdit(material)}
              className="bg-blue-500 text-white">
              <IconEdit className="mr-1" /> Edit
            </Button>
            <Button
              onClick={() => onDelete(material.id)}
              className="bg-red-500 text-white">
              <IconTrash className="mr-1" /> Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MaterialList;
