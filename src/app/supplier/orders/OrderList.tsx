import { cn } from '@/lib/utils';
import { getStatusColor } from '@/lib/utils';
import { OwnerOrder } from '@/types/inventory.types';
import Image from 'next/image';

interface OrderListProps {
  orders: OwnerOrder[];
  isLoading: boolean;
  onSelectOrder: (order: OwnerOrder) => void;
}

export default function OrderList({
  orders,
  isLoading,
  onSelectOrder
}: OrderListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div
          key={order.id}
          className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition"
          onClick={() => onSelectOrder(order)}>
          <div className="flex gap-4">
            {order.supplier_offer?.image_url && (
              <div className="relative w-24 h-24 flex-shrink-0">
                <Image
                  src={order.supplier_offer.image_url}
                  alt={order.supplier_offer.material_name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{order.furniture_type}</h3>
                  <p className="text-sm text-gray-600">
                    Material: {order.supplier_offer?.material_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantity: {order.quantity_needed}
                  </p>
                  <p className="text-sm text-gray-600">
                    Target Date:{' '}
                    {new Date(
                      order.target_completion_date
                    ).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={cn(
                    'px-2 py-1 rounded-full text-xs',
                    getStatusColor(order.status)
                  )}>
                  {order.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Owner: {order.owner?.full_name}
              </div>
            </div>
          </div>
        </div>
      ))}

      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500">No orders found</div>
      )}
    </div>
  );
}
