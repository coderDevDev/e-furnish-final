'use client';

import { useEffect, useState } from 'react';
import SupplierOfferList from './SupplierOfferList';
import AddRawMaterialOfferForm from './AddRawMaterialOfferForm';
import { supplierOfferService } from '@/lib/services/supplierOfferService';
import { SupplierOffer, SupplierOfferFormData } from '@/types/inventory.types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export default function SupplierOrderManagement() {
  const [offers, setOffers] = useState<SupplierOffer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SupplierOffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const data = await supplierOfferService.getAllOffers();
      setOffers(data);
    } catch (error) {
      toast.error('Failed to fetch offers');
      console.error('Error fetching offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleAddOffer = async (data: SupplierOfferFormData) => {
    try {
      await supplierOfferService.createOffer(data);
      await fetchOffers();
      setIsModalOpen(false);
      toast.success('Offer added successfully');
    } catch (error) {
      toast.error('Failed to add offer');
      throw error;
    }
  };

  const handleEditOffer = async (data: SupplierOfferFormData) => {
    try {
      if (!editingOffer) return;

      await supplierOfferService.updateOffer(editingOffer.id, data);
      await fetchOffers();
      setEditingOffer(null);
      setIsModalOpen(false);
      toast.success('Offer updated successfully');
    } catch (error) {
      console.error('Error updating offer:', error);
      toast.error('Failed to update offer');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    try {
      // Add confirmation dialog
      if (!window.confirm('Are you sure you want to delete this offer?')) {
        return;
      }

      await supplierOfferService.deleteOffer(id);
      await fetchOffers();
      toast.success('Offer deleted successfully');
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    }
  };

  const openEditModal = (offer: SupplierOffer) => {
    setEditingOffer(offer);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Material Offers</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add New Offer
        </Button>
      </div>

      <SupplierOfferList
        offers={offers}
        onEdit={openEditModal}
        onDelete={handleDeleteOffer}
        isLoading={isLoading}
      />

      {isModalOpen && (
        <AddRawMaterialOfferForm
          initialData={editingOffer}
          onAdd={editingOffer ? handleEditOffer : handleAddOffer}
          onClose={() => {
            setIsModalOpen(false);
            setEditingOffer(null);
          }}
        />
      )}
    </div>
  );
}
