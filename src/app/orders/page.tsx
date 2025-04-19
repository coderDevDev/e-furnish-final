'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/lib/services/authService';
import { Link, Loader2, Package2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const userOrders = await authService.getUserOrders();
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.payment_status === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50">
        <Package2 className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Orders Yet</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Looks like you haven't placed any orders yet. Start shopping to see
          your orders here!
        </p>
        <Button asChild>
          <a href="/shop" className="px-8">
            Browse Products
          </a>
        </Button>
      </div>
    );
  }

  return (
    <main className="container py-10 max-w-[1200px] mx-auto px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Orders</h1>
          <p className="text-gray-600">Manage your orders</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {console.log({ filteredOrders })}
      <div className="grid gap-6">
        {filteredOrders.map(order => (
          <a
            key={order.id}
            href={`/orders/${order.id}`}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Order placed{' '}
                    {formatDistanceToNow(new Date(order.created_at), {
                      addSuffix: true
                    })}
                  </p>
                  <p className="text-sm font-medium">Order #{order.id}</p>
                </div>
                <Badge
                  className={`${getStatusColor(
                    order.payment_status
                  )} mt-2 sm:mt-0`}>
                  {order.payment_status.charAt(0).toUpperCase() +
                    order.payment_status.slice(1)}
                </Badge>
              </div>

              <div className="grid gap-4">
                {/* Product Images Preview */}
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex-none relative">
                      <div className="w-20 h-20 relative rounded-md overflow-hidden bg-gray-100">
                        <Image
                          src={item.product.gallery[0]}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                        />
                        {item.quantity > 1 && (
                          <div className="absolute bottom-0 right-0 bg-black/50 text-white text-xs px-1 rounded-tl">
                            x{item.quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-600">
                      {order.items.length}{' '}
                      {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                    <p className="font-medium">
                      ₱{order.total_amount.toLocaleString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
