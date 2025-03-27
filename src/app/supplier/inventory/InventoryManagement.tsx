'use client';

import { useEffect, useState } from 'react';
import InventoryTable from './InventoryTable';
import AddInventoryItemForm from './AddInventoryItemForm';
import { inventoryService } from '@/lib/services/inventoryService';
import { InventoryItem } from '@/types/inventory.types';

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInventory = async () => {
    const data = await inventoryService.getAllInventoryItems();
    setInventory(data);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddItem = async (item: Omit<InventoryItem, 'id'>) => {
    await inventoryService.addInventoryItem(item);
    fetchInventory();
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Inventory Management</h2>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-primary text-white p-2 rounded">
        Add Item
      </button>
      <InventoryTable inventory={inventory} />
      {isModalOpen && (
        <AddInventoryItemForm
          onAdd={handleAddItem}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
