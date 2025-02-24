'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/lib/services/authService';
import { Link, Loader2 } from 'lucide-react';
import OrderCard from '@/components/orders/OrderCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAppSelector } from '@/lib/hooks/redux';

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
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">No Orders Yet</h2>
        <p className="text-gray-600 mb-6">
          Start shopping to see your orders here!
        </p>
        {/* <Button asChild>
          <Link href="/shop">Browse Products</Link>
        </Button> */}
      </div>
    );
  }

  return (
    <main className="container py-10 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6">
        {filteredOrders.map(order => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </main>
  );
}
