'use client';

import { useEffect, useState, useRef } from 'react';
import {
  customerOrderService,
  OrderSummary
} from '@/lib/services/customerOrderService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Printer, Mail, Ban, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { OrderTimeline } from '../components/OrderTimeline';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  User,
  MapPin,
  CalendarClock,
  ShoppingBag,
  CreditCard,
  Banknote,
  Truck,
  AlertCircle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import OrderInvoice from '@/components/orders/OrderInvoice';
import { supabase } from '@/lib/supabase/config';

const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned'
];

export default function OrderDetailsPage({
  params
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOrderDetails();
  }, []);

  const [isLoaded, setIsLoaded] = useState(false);
  const loadOrderDetails = async () => {
    try {
      const data = await customerOrderService.getOrderDetails(id);

      // If we have items but empty order_items, let's populate the order_items with product details
      if (
        Array.isArray(data.items) &&
        data.items.length > 0 &&
        (!data.order_items || data.order_items.length === 0)
      ) {
        // Create a new array to hold the enhanced items
        const enhancedItems = [];

        // Fetch product details for each item
        for (const item of data.items) {
          try {
            // Fetch product details from your service or directly from Supabase
            const { data: productData } = await supabase
              .from('products')
              .select('*')
              .eq('id', item.product_id)
              .single();

            if (productData) {
              enhancedItems.push({
                ...item,
                products: productData // Add the product details
              });
            } else {
              // If product not found, still add the item with basic info
              enhancedItems.push({
                ...item,
                products: { title: `Product #${item.product_id}` }
              });
            }
          } catch (error) {
            console.error(`Error fetching product ${item.product_id}:`, error);
          }
        }

        // Update the data with the enhanced items
        data.order_items = enhancedItems;
      }

      setOrder(data);
      setNewStatus(data.status);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;

    setUpdating(true);
    try {
      await customerOrderService.updateOrderStatus(id, newStatus);
      toast.success('Order status updated successfully');
      loadOrderDetails();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !cancelReason) return;

    setUpdating(true);
    try {
      await customerOrderService.updateOrderStatus(
        id,
        'cancelled',
        cancelReason
      );
      toast.success('Order cancelled successfully');
      loadOrderDetails();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  const printInvoice = () => {
    setShowInvoice(true);

    // Use setTimeout to ensure the modal is rendered before printing
    setTimeout(() => {
      if (invoiceRef.current) {
        // Option 1: Direct window printing (opens print dialog)
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Order Invoice #${order?.id}</title>
                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                <style>
                  @media print {
                    body { padding: 20px; }
                  }
                </style>
              </head>
              <body>
                ${invoiceRef.current.outerHTML}
                <script>
                  window.onload = function() { window.print(); }
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    }, 300);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Order Not Found</h2>
        <p className="text-muted-foreground">
          The requested order could not be found
        </p>
        <Button className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // Format the complete address from shipping details
  const formatCompleteAddress = () => {
    if (!order.shipping_address) return 'No shipping details available';

    const details = order.shipping_address;

    // Gather all address components
    const addressParts = [
      details.street,
      details.barangay_name,
      details.city_name,
      details.province_name,
      details.region_name
    ].filter(Boolean); // Filter out any undefined/null/empty values

    return addressParts.join(', ');
  };

  return (
    isLoaded && (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Order #{order.id}</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={printInvoice}
              className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print Invoice
            </Button>
            {/* <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Send Update
          </Button> */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Ban className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Order</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for cancelling this order.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Enter cancellation reason..."
                />
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={handleCancelOrder}
                    disabled={updating || !cancelReason}>
                    {updating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm Cancellation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                Order details and customer information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">
                    {format(new Date(order.created_at), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{order.profiles.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Payment Method
                  </p>
                  <p className="font-medium capitalize">
                    {order.payment_method}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Shipping Address
                </p>
                <p className="font-medium whitespace-pre-wrap">
                  {formatCompleteAddress()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
              <CardDescription>Current status and timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Select
                  value={newStatus}
                  onValueChange={handleStatusChange}
                  disabled={updating}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <OrderTimeline status={order.status} />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Products and customizations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {console.log({ dy: order.order_items })}
                {order.order_items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between border-b py-4 last:border-0">
                    <div>
                      <p className="font-medium">{item.products.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                      {item.customization && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p>Customizations:</p>
                          <ul className="list-inside list-disc">
                            {Object.entries(item.customization).map(
                              ([key, value]) => (
                                <li key={key}>
                                  {key}: {JSON.stringify(value)}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    <p className="font-medium">
                      ₱{(item.products.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-4">
                  <p className="font-medium">Total Amount</p>
                  <p className="font-medium">
                    ₱{order.total_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Status Update</DialogTitle>
              <DialogDescription>
                Are you sure you want to update this order status to{' '}
                <span className="font-semibold">
                  {newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
                </span>
                ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={updating}>
                Cancel
              </Button>
              <Button onClick={handleStatusChange} disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Confirm'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                          <title>Order Invoice #${order?.id}</title>
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
      </div>
    )
  );
}
