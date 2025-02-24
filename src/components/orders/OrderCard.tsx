// import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '../ui/button';

interface OrderCardProps {
  order: {
    id: string;
    created_at: string;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    items: Array<{
      product: {
        title: string;
        srcUrl: string;
      };
      quantity: number;
      price: number;
      customization?: {
        dimensions?: {
          size: number;
        };
        addons?: Array<{
          name: string;
          quantity: number;
          unit: string;
        }>;
      };
    }>;
  };
}

const OrderCard = ({ order }: OrderCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Order #{order.id}</h3>
          <p className="text-gray-600">{order.created_at}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">
            ₱{order.total_amount.toLocaleString()}
          </p>
          <span
            className={`inline-block px-2 py-1 rounded text-sm ${
              order.payment_status === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
            {order.payment_status.charAt(0).toUpperCase() +
              order.payment_status.slice(1)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {order.items.map((item, index) => (
          <div
            key={index}
            className="flex items-start justify-between py-2 border-t">
            <div className="flex-1">
              <h4 className="font-medium">{item.product.title}</h4>
              <p className="text-gray-600">Quantity: {item.quantity}</p>
              {item.customization && (
                <div className="text-sm text-gray-500">
                  {item.customization.dimensions && (
                    <p>Size: {item.customization.dimensions.size}cm</p>
                  )}
                  {item.customization.addons && (
                    <div>
                      <p>Add-ons:</p>
                      <ul className="list-disc list-inside">
                        {item.customization.addons.map((addon, i) => (
                          <li key={i}>
                            {addon.name} ({addon.quantity} {addon.unit}
                            {addon.quantity > 1 ? 's' : ''})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="font-medium">₱{item.price.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <Button variant="outline" asChild>
          <Link href={`/orders/${order.id}`}>View Details</Link>
        </Button>
        <Button variant="outline">Reorder</Button>
      </div>
    </div>
  );
};

export default OrderCard;
