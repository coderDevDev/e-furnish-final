'use client';

import { useEffect, useState } from 'react';
import MaterialList from './MaterialList';
import AddMaterialForm from './AddMaterialForm';
import { materialService } from '@/lib/services/materialService';
import { Material } from '@/types/inventory.types';

export default function MaterialManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMaterials = async () => {
    const data = await materialService.getAllMaterials();
    setMaterials(data);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleAddMaterial = async (material: Omit<Material, 'id'>) => {
    await materialService.addMaterial(material);
    fetchMaterials();
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Materials Management</h2>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-primary text-white p-2 rounded">
        Add Material
      </button>
      <MaterialList materials={materials} />
      {isModalOpen && (
        <AddMaterialForm
          onAdd={handleAddMaterial}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
