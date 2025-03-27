import { X } from 'lucide-react';
import { OwnerOrder } from '@/types/inventory.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import DetailItem from './DetailItem';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';

interface OrderDetailsProps {
  order: OwnerOrder;
  onStatusUpdate: (
    orderId: string,
    status: OwnerOrder['status']
  ) => Promise<void>;
  onClose: () => void;
}

export default function OrderDetails({
  order,
  onStatusUpdate,
  onClose
}: OrderDetailsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-semibold">Order Details</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Material Offer Details */}
        {order.supplier_offer && (
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Material Details</h3>
            <div className="flex gap-4">
              {order.supplier_offer.image_url && (
                <div className="relative w-32 h-32 flex-shrink-0">
                  <Image
                    src={order.supplier_offer.image_url}
                    alt={order.supplier_offer.material_name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              )}
              <div className="flex-1">
                <DetailItem
                  label="Material"
                  value={order.supplier_offer.material_name}
                />
                <DetailItem
                  label="Price per Unit"
                  value={`$${order.supplier_offer.price_per_unit} per ${order.supplier_offer.unit}`}
                />
                <DetailItem
                  label="Available Quantity"
                  value={`${order.supplier_offer.quantity} ${order.supplier_offer.unit}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Furniture Details */}
        <div className="border-b pb-4">
          <h3 className="font-semibold mb-3">Furniture Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Furniture Type" value={order.furniture_type} />
            <DetailItem
              label="Quantity"
              value={order.quantity_needed.toString()}
            />
            <DetailItem
              label="Dimensions"
              value={`${order.furniture_details.dimensions.width}x${order.furniture_details.dimensions.height}x${order.furniture_details.dimensions.depth}`}
            />
            <DetailItem label="Color" value={order.furniture_details.color} />
            <DetailItem label="Style" value={order.furniture_details.style} />
          </div>
          {order.furniture_details.additional_details && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700">
                Additional Details
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {order.furniture_details.additional_details}
              </p>
            </div>
          )}
        </div>

        {/* Owner Information */}
        <div className="border-b pb-4">
          <h3 className="font-semibold mb-3">Owner Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Name" value={order.owner?.full_name || ''} />
            <DetailItem label="Email" value={order.owner?.email || ''} />
            <DetailItem label="Phone" value={order.owner?.phone || ''} />
            <DetailItem
              label="Delivery Address"
              value={order.delivery_address}
            />
          </div>
        </div>

        {/* Order Status */}
        <div>
          <h3 className="font-semibold mb-3">Order Status</h3>
          <div className="space-y-4">
            <DetailItem
              label="Target Completion"
              value={formatDate(order.target_completion_date)}
            />
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Update Status
              </label>
              <Select
                value={order.status}
                onValueChange={value =>
                  onStatusUpdate(order.id, value as OwnerOrder['status'])
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
