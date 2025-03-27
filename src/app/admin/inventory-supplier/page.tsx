'use client';

import { useEffect, useState } from 'react';
import { productService } from '@/lib/services/productService';
import type { Product } from '@/types/product.types';
import InventoryManagement from './InventoryManagement';
import SupplierOfferList from './SupplierOfferList';
import AddSupplierOfferForm from './AddSupplierOfferForm';
import { supplierOfferService } from '@/lib/services/supplierOfferService';
import { SupplierOffer } from '@/types/inventory.types';
import { Button } from '@/components/ui/button';

export default function InventorySupplierPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<SupplierOffer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOffers = async () => {
    const data = await supplierOfferService.getAllOffers();
    setOffers(data);
  };

  useEffect(() => {
    fetchProducts();
    fetchOffers();
  }, []);

  const handleAddOffer = async (offer: Omit<SupplierOffer, 'id'>) => {
    await supplierOfferService.createOffer(offer);
    fetchOffers();
  };

  const handleDeleteOffer = async (id: number) => {
    await supplierOfferService.deleteOffer(id);
    fetchOffers();
  };

  return (
    <div className="">
      <InventoryManagement products={products} fetchProducts={fetchProducts} />
      <h2 className="text-2xl font-semibold">Supplier Offers Management</h2>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-primary text-white p-2 rounded">
        Add Supplier Offer
      </Button>
      <SupplierOfferList
        offers={offers}
        onEdit={() => {}}
        onDelete={handleDeleteOffer}
      />
      {isModalOpen && (
        <AddSupplierOfferForm
          onAdd={handleAddOffer}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
