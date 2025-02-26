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
  const [isExpanded, setIsExpanded] = useState(false);

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
            <h1 className="text-2xl font-bold mb-2">Order Details</h1>
            <p className="text-gray-600">
              {new Date(order.created_at).toLocaleString('en-PH', {
                timeZone: 'Asia/Manila'
              })}
            </p>
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
        {/* Collapsible Order Details Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Products</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
          {isExpanded && (
            <div className="space-y-4 mt-4">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{item.product.title}</h3>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                    {item.customization && (
                      <div className="text-sm text-gray-500">
                        <p>Customization:</p>
                        <ul className="list-disc list-inside">
                          {item.customization.material && (
                            <li>Material: {item.customization.material}</li>
                          )}
                          {item.customization.color && (
                            <li>Color: {item.customization.color.name}</li>
                          )}
                          {item.customization.addons.length > 0 && (
                            <li>
                              Add-ons:
                              <ul className="list-disc list-inside ml-4">
                                {item.customization.addons.map((addon: any) => (
                                  <li key={addon.id}>{addon.name}</li>
                                ))}
                              </ul>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      ₱{item.product.price.toLocaleString()}
                    </p>
                    {item.customization && (
                      <p className="text-sm text-gray-500">
                        Customization Cost: ₱
                        {item.customization.totalCustomizationCost.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
