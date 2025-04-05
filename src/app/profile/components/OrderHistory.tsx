'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: orders, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            *,
            product:products (*)
          )
        `
        )
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Package2 className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">No Orders Yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            When you place orders, they will appear here
          </p>
          <Button asChild className="mt-4">
            <a href="/shop">Start Shopping</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
        <CardDescription>View and track your orders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {orders.map(order => (
            <div
              key={order.id}
              className="rounded-lg border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Order placed{' '}
                    {formatDistanceToNow(new Date(order.created_at), {
                      addSuffix: true
                    })}
                  </p>
                  <p className="text-sm font-medium">Order #{order.id}</p>
                </div>
                <Badge
                  className={
                    order.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>

              <div className="space-y-4">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-20 w-20 flex-shrink-0">
                      <div className="relative h-full w-full overflow-hidden rounded-lg">
                        <Image
                          src={item.product.gallery[0]}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">{item.product.title}</h4>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                      <p className="mt-1 font-medium">
                        ₱{item.product.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-between border-t pt-4">
                <span className="font-medium">Total</span>
                <span className="font-medium">
                  ₱{order.total_amount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
