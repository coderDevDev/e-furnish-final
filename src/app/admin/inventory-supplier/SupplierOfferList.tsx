'use client';

import { SupplierOffer } from '@/types/inventory.types';
import { Button } from '@/components/ui/button';
import { IconEdit, IconTrash } from 'lucide-react';

interface SupplierOfferListProps {
  offers: SupplierOffer[];
  onEdit: (offer: SupplierOffer) => void;
  onDelete: (id: number) => void;
}

const SupplierOfferList: React.FC<SupplierOfferListProps> = ({
  offers,
  onEdit,
  onDelete
}) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {offers.map(offer => (
        <div
          key={offer.id}
          className="border rounded-lg p-4 shadow-md flex justify-between items-center">
          <div className="flex items-center">
            <div>
              <h3 className="text-lg font-semibold">{offer.material_name}</h3>
              <p className="text-gray-600">Price: ${offer.price_per_unit}</p>
              <p className="text-gray-800">
                Quantity Available: {offer.quantity}
              </p>
              <p className="text-gray-800">Supplier: {offer.supplier_id}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => onEdit(offer)}
              className="bg-blue-500 text-white">
              <IconEdit className="mr-1" /> Edit
            </Button>
            <Button
              onClick={() => onDelete(offer.id)}
              className="bg-red-500 text-white">
              <IconTrash className="mr-1" /> Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SupplierOfferList;
