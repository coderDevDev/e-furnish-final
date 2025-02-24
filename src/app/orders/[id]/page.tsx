'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/lib/services/authService';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import Link from 'next/link';

interface OrderDetailsProps {
  params: {
    id: string;
  };
}

export default function OrderDetailsPage({ params }: OrderDetailsProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [params.id]);

  const loadOrderDetails = async () => {
    try {
      const orderDetails = await authService.getOrderDetails(params.id);
      setOrder(orderDetails);
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Order Not Found</h2>
        <p className="text-gray-600 mb-6">
          The order you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="container py-10 max-w-[1000px] mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">Order #{order.id}</h1>
            <p className="text-gray-600">{order.created_at}</p>
          </div>
          <Badge
            variant={
              order.payment_status === 'completed' ? 'success' : 'warning'
            }>
            {order.payment_status.charAt(0).toUpperCase() +
              order.payment_status.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Products Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Products</h2>
          <div className="space-y-4">
            {order.items.map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-start justify-between py-4 border-t first:border-t-0">
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.title}</h4>
                  <p className="text-gray-600">Quantity: {item.quantity}</p>
                  {item.customization && (
                    <div className="text-sm text-gray-500 mt-2">
                      {item.customization.dimensions && (
                        <p>Size: {item.customization.dimensions.size}cm</p>
                      )}
                      {item.customization.addons && (
                        <div>
                          <p className="mt-1">Add-ons:</p>
                          <ul className="list-disc list-inside">
                            {item.customization.addons.map(
                              (addon: any, i: number) => (
                                <li key={i}>
                                  {addon.name} ({addon.quantity} {addon.unit}
                                  {addon.quantity > 1 ? 's' : ''})
                                </li>
                              )
                            )}
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
        </div>

        {/* Shipping Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
          <div className="space-y-2">
            <p>
              <span className="text-gray-600">Address: </span>
              {order.shipping_address.street},{' '}
              {order.shipping_address.barangay_name},{' '}
              {order.shipping_address.city_name},{' '}
              {order.shipping_address.province_name}
            </p>
            <p>
              <span className="text-gray-600">Region: </span>
              {order.shipping_address.region_name}
            </p>
            <p>
              <span className="text-gray-600">ZIP Code: </span>
              {order.shipping_address.zip_code}
            </p>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="uppercase">{order.payment_method}</span>
            </div>
            {order.payment_method === 'cod' && order.change_needed && (
              <div className="flex justify-between">
                <span className="text-gray-600">Change Needed For</span>
                <span>₱{order.change_needed.toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Amount</span>
              <span>₱{order.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button asChild>
            <Link href="/orders">Back to Orders</Link>
          </Button>
          {/* <Button>Track Order</Button> */}
        </div>
      </div>
    </main>
  );
}
