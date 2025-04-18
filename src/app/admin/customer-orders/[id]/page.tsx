'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    loadOrderDetails();
  }, []);

  const loadOrderDetails = async () => {
    try {
      const data = await customerOrderService.getOrderDetails(id);
      setOrder(data);
      setNewStatus(data.status);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
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
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium capitalize">{order.payment_method}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shipping Address</p>
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
              {order.order_items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between border-b py-4 last:border-0">
                  <div>
                    <p className="font-medium">{item.product.title}</p>
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
                    ₱{(item.product.price * item.quantity).toLocaleString()}
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
    </div>
  );
}
