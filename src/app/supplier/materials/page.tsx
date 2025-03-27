'use client';

import { useEffect, useState } from 'react';
import MaterialList from './MaterialList';
import AddMaterialForm from './AddMaterialForm';
import { materialService } from '@/lib/services/materialService';
import { Material } from '@/types/inventory.types';
import { Button } from '@/components/ui/button';

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

  const handleDeleteMaterial = async (id: number) => {
    await materialService.deleteMaterial(id); // Implement this function in your service
    fetchMaterials();
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Materials Management</h2>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-primary text-white p-2 rounded">
        Add Material
      </Button>
      <MaterialList
        materials={materials}
        onEdit={() => {}}
        onDelete={handleDeleteMaterial}
      />
      {isModalOpen && (
        <AddMaterialForm
          onAdd={handleAddMaterial}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
