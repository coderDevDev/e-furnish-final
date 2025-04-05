'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/lib/services/authService';
import { Loader2, Package2, Truck, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';

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
    <main className="container py-10 max-w-[1000px] mx-auto px-4">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Order Details</h1>
            <p className="text-gray-600">
              Placed on{' '}
              {new Date(order.created_at).toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Manila'
              })}
            </p>
          </div>
          <Badge
            className={`${
              order.payment_status === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
            {order.payment_status.charAt(0).toUpperCase() +
              order.payment_status.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package2 className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Order Items</h2>
            </div>
            <div className="space-y-6">
              {order.items.map((item: any, index: number) => (
                <div key={index}>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 relative rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={item.product.gallery[0]}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium text-lg">
                        {item.product.title}
                      </h3>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                      <div className="mt-2">
                        <p className="text-lg font-semibold">
                          ₱{item.product.price.toLocaleString()}
                        </p>
                        {item.customization && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p className="font-medium">Customization:</p>
                            <ul className="list-disc list-inside ml-2">
                              {item.customization.material && (
                                <li>Material: {item.customization.material}</li>
                              )}
                              {item.customization.color && (
                                <li>Color: {item.customization.color.name}</li>
                              )}
                              {item.customization.addons?.length > 0 && (
                                <li>
                                  Add-ons:{' '}
                                  {item.customization.addons
                                    .map((addon: any) => addon.name)
                                    .join(', ')}
                                </li>
                              )}
                            </ul>
                            <p className="mt-1">
                              Customization Cost: ₱
                              {item.customization.totalCustomizationCost.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < order.items.length - 1 && (
                    <Separator className="my-6" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Truck className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Shipping Informationss</h2>
          </div>
          <div className="space-y-2 text-gray-600">
            <p>
              <span className="font-medium">Address: </span>
              {order.shipping_address.street}
            </p>
            <p>
              {order.shipping_address.barangay_name},{' '}
              {order.shipping_address.city_name}
            </p>
            <p>
              {order.shipping_address.province_name},{' '}
              {order.shipping_address.region_name}
            </p>
            <p>
              <span className="font-medium">ZIP Code: </span>
              {order.shipping_address.zip_code}
            </p>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Payment Information</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium uppercase">
                {order.payment_method}
              </span>
            </div>
            {order.payment_method === 'cod' && order.change_needed && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Change Needed For</span>
                <span className="font-medium">
                  ₱{order.change_needed.toLocaleString()}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium">Total Amount</span>
              <span className="font-bold">
                ₱{order.total_amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" asChild>
            <Link href="/orders">Back to Orders</Link>
          </Button>
          <Button>Track Order</Button>
        </div>
      </div>
    </main>
  );
}
