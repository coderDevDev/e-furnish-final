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

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="Furniture Type" value={order.furniture_type} />
          <DetailItem
            label="Quantity"
            value={order.quantity_needed.toString()}
          />
          <DetailItem label="Status" value={order.status} />
          <DetailItem
            label="Target Date"
            value={new Date(order.target_completion_date).toLocaleDateString()}
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Furniture Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              label="Dimensions"
              value={`${order.furniture_details.dimensions.width}x${order.furniture_details.dimensions.height}x${order.furniture_details.dimensions.depth}`}
            />
            <DetailItem label="Color" value={order.furniture_details.color} />
            <DetailItem label="Style" value={order.furniture_details.style} />
          </div>
          {order.furniture_details.additional_details && (
            <div className="mt-2">
              <h4 className="text-sm font-medium text-gray-700">
                Additional Details
              </h4>
              <p className="text-sm text-gray-600">
                {order.furniture_details.additional_details}
              </p>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Owner Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Name" value={order.owner?.name || ''} />
            <DetailItem label="Email" value={order.owner?.email || ''} />
            <DetailItem label="Phone" value={order.owner?.phone || ''} />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Update Status</h3>
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
  );
}
