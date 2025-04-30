'use client';

import { useEffect, useState, useRef } from 'react';
import { authService } from '@/lib/services/authService';
import {
  Loader2,
  Package2,
  Truck,
  CreditCard,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import OrderInvoice from '@/components/orders/OrderInvoice';

interface OrderDetailsProps {
  params: {
    id: string;
  };
}

export default function OrderDetailsPage({ params }: OrderDetailsProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOrderDetails();
  }, [params.id]);

  const loadOrderDetails = async () => {
    try {
      const orderDetails = await authService.getOrderDetails(params.id);
      setOrder(orderDetails);
    } catch (error) {
      console.error('Error loading order details:', error);
      toast.error('Could not load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    // Close the confirmation dialog
    setShowCancelDialog(false);

    // Check if order is in a state that can be cancelled
    if (order.status === 'delivered' || order.status === 'cancelled') {
      toast.error(`Cannot cancel an order that is already ${order.status}`);
      return;
    }

    try {
      setCancelLoading(true);
      const updatedOrder = await authService.cancelOrder(order.id);
      setOrder(updatedOrder);
      toast.success('Order has been cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  const printInvoice = () => {
    setShowInvoice(true);

    // Use setTimeout to ensure the modal is rendered before printing
    setTimeout(() => {
      if (invoiceRef.current) {
        const originalContents = document.body.innerHTML;
        const printContents = invoiceRef.current.innerHTML;

        // Add print-specific CSS
        const printStyles = `
          <style>
            @media print {
              body * { visibility: hidden; }
              #invoice-to-print, #invoice-to-print * { visibility: visible; }
              #invoice-to-print { position: absolute; left: 0; top: 0; width: 100%; }
            }
          </style>
        `;

        document.body.innerHTML = printStyles + printContents;
        window.print();
        document.body.innerHTML = originalContents;

        // Reload the page to restore functionality after printing
        window.location.reload();
      }
    }, 300);
  };

  const canBeCancelled =
    order &&
    !['delivered', 'cancelled'].includes(order.status) &&
    new Date(order.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000); // Within 24 hours

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center flex-col">
        <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-4">
          Sorry, we couldn't find the order you're looking for.
        </p>
        <Button asChild>
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="container py-10 max-w-[1000px] mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>
        <Badge
          className={`text-sm py-1 px-3 ${
            order.status === 'completed' || order.status === 'delivered'
              ? 'bg-green-500'
              : order.status === 'pending'
              ? 'bg-yellow-500'
              : order.status === 'processing'
              ? 'bg-blue-500'
              : order.status === 'shipped'
              ? 'bg-indigo-500'
              : 'bg-red-500'
          }`}>
          {order.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="md:col-span-2 space-y-6">
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
                            src={
                              item.product?.gallery?.[0] ||
                              item.product?.srcurl ||
                              '/placeholder-product.png'
                            }
                            alt={item.product.title || item.product.name}
                            fill
                            className="object-cover"
                          />
                          {item.product.customization && (
                            <div className="absolute top-0 left-0 bg-primary/70 text-white text-xs p-1 rounded-br">
                              Custom
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-medium text-lg">
                            {item.product.title}
                          </h3>
                          <p className="text-gray-600">
                            Quantity: {item.quantity}
                          </p>
                          <div className="mt-2">
                            <p className="text-lg font-semibold">
                              ₱
                              {item.product.price.toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </p>
                            {item.customization && (
                              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                <p className="font-medium text-gray-700 mb-1">
                                  Customization Details:
                                </p>

                                {/* Show breakdown if available */}
                                {item.customization.breakdown?.length > 0 ? (
                                  <div className="space-y-1">
                                    {item.customization.breakdown.map(
                                      (custom: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="flex justify-between">
                                          <span>
                                            {custom.fieldLabel}:{' '}
                                            {custom.details?.name ||
                                              custom.selectedValue}
                                            {custom.details?.color && (
                                              <span
                                                className="inline-block w-3 h-3 ml-1 rounded-full"
                                                style={{
                                                  backgroundColor:
                                                    custom.details.color
                                                }}
                                              />
                                            )}
                                          </span>
                                          {custom.cost > 0 && (
                                            <span className="text-gray-700">
                                              +₱
                                              {custom.cost.toLocaleString(
                                                'en-PH',
                                                {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2
                                                }
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      )
                                    )}
                                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-medium">
                                      <span>Total Customization:</span>
                                      <span>
                                        ₱
                                        {item.customization.totalCustomizationCost?.toLocaleString(
                                          'en-PH',
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                          }
                                        ) || '0.00'}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  // Simple fields display if no breakdown
                                  <div className="space-y-1">
                                    {Object.entries(
                                      item.customization.fields || {}
                                    ).map(
                                      (
                                        [key, value]: [string, any],
                                        i: number
                                      ) => (
                                        <div
                                          key={i}
                                          className="flex justify-between">
                                          <span>
                                            {key
                                              .replace(/([A-Z])/g, ' $1')
                                              .replace(/^./, str =>
                                                str.toUpperCase()
                                              )}
                                            :
                                            {typeof value === 'object'
                                              ? value.name ||
                                                JSON.stringify(value)
                                              : value}
                                          </span>
                                        </div>
                                      )
                                    )}
                                    {item.customization.totalCustomizationCost >
                                      0 && (
                                      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-medium">
                                        <span>Total Customization:</span>
                                        <span>
                                          ₱
                                          {item.customization.totalCustomizationCost.toLocaleString(
                                            'en-PH',
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2
                                            }
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
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
                <h2 className="text-lg font-semibold">Shipping Information</h2>
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
          </div>
        </div>

        {/* Payment Information Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Payment Information</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium uppercase">
                  {order.payment_method === 'cod'
                    ? 'Cash on Delivery (COD)'
                    : order.payment_method}
                </span>
              </div>
              {order.payment_method === 'cod' && order.change_needed && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Change Needed For</span>
                  <span className="font-medium">
                    ₱
                    {order.change_needed.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium">Total Amount</span>
                <span className="font-bold">
                  ₱
                  {parseFloat(order.total_amount).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4 mt-8">
        <Button variant="outline" asChild>
          <Link href="/orders">Back to Orders</Link>
        </Button>

        <Button
          variant="outline"
          onClick={printInvoice}
          className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Invoice
        </Button>

        {canBeCancelled && (
          <Button
            variant="destructive"
            onClick={() => setShowCancelDialog(true)}
            disabled={cancelLoading}>
            {cancelLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Order'
            )}
          </Button>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              Confirm Order Cancellation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}>
              No, Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={cancelLoading}>
              {cancelLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Order'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <OrderInvoice order={order} ref={invoiceRef} />
          <DialogFooter className="p-4 bg-gray-50 border-t">
            <Button variant="outline" onClick={() => setShowInvoice(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (invoiceRef.current) {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Order Invoice #${order.id}</title>
                          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                        </head>
                        <body>
                          ${invoiceRef.current.outerHTML}
                          <script>
                            window.onload = function() { window.print(); window.close(); }
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }
                }
              }}
              className="bg-primary hover:bg-primary/90">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
