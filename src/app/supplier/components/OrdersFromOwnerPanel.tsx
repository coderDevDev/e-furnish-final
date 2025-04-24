'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import {
  Loader2,
  Eye,
  Package,
  Truck,
  CheckCircle,
  InboxIcon
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';

type Order = {
  id: string;
  created_at: string;
  admin_id: string;
  supplier_id: string;
  order_items: any[];
  status: 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  admin_name?: string;
  payment_terms: string;
  delivery_date: string;
  tracking_number?: string;
  notes?: string;
};

export default function OrdersFromOwnerPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updating, setUpdating] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription for orders
    const subscription = supabase
      .channel('supplier-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supplier_orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get supplier ID
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!supplierData) return;

      // Get orders for this supplier
      const { data, error } = await supabase
        .from('supplier_orders')
        .select(
          `
          *,
          profiles:admin_id (full_name)
        `
        )
        .eq('supplier_id', supplierData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data to add admin_name
      const processedOrders = data.map((order: any) => ({
        ...order,
        admin_name: order.profiles?.full_name || 'Unknown'
      }));

      setOrders(processedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      setUpdating(true);

      const { error } = await supabase
        .from('supplier_orders')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Order ${status} successfully`);

      // Update local state
      setOrders(
        orders.map(order =>
          order.id === orderId ? { ...order, status: status as any } : order
        )
      );

      // Close dialog if open
      if (showOrderDetails) {
        setShowOrderDetails(false);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary">Approved</Badge>;
      case 'shipped':
        return <Badge variant="default">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No orders received yet.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>Manage your orders</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {order.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {format(new Date(order.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>{order.admin_name}</TableCell>
                <TableCell>₱{order.total_amount.toLocaleString()}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewOrderDetails(order)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Order Details Dialog */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Order ID</p>
                    <p>{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p>
                      {format(
                        new Date(selectedOrder.created_at),
                        'MMM d, yyyy h:mm a'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">From</p>
                    <p>{selectedOrder.admin_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p>{getStatusBadge(selectedOrder.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Delivery Date</p>
                    <p>
                      {format(
                        new Date(selectedOrder.delivery_date),
                        'MMM d, yyyy'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Terms</p>
                    <p>
                      {selectedOrder.payment_terms === 'cod'
                        ? 'Cash on Delivery'
                        : selectedOrder.payment_terms === '15_days'
                        ? 'Net 15 Days'
                        : selectedOrder.payment_terms === '30_days'
                        ? 'Net 30 Days'
                        : selectedOrder.payment_terms === '60_days'
                        ? 'Net 60 Days'
                        : selectedOrder.payment_terms}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Items</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.order_items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₱{item.price.toLocaleString()}</TableCell>
                          <TableCell>
                            ₱{(item.quantity * item.price).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <div className="bg-muted p-4 rounded-md">
                    <p className="font-medium">
                      Total: ₱{selectedOrder.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm font-medium">Notes</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Action buttons based on order status */}
                {selectedOrder.status === 'pending' && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="destructive"
                      disabled={updating}
                      onClick={() =>
                        updateOrderStatus(selectedOrder.id, 'cancelled')
                      }>
                      Cancel Order
                    </Button>
                    <Button
                      disabled={updating}
                      onClick={() =>
                        updateOrderStatus(selectedOrder.id, 'approved')
                      }>
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Accept Order
                    </Button>
                  </div>
                )}

                {selectedOrder.status === 'approved' && (
                  <div className="flex justify-end">
                    <Button
                      disabled={updating}
                      onClick={() =>
                        updateOrderStatus(selectedOrder.id, 'shipped')
                      }>
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Truck className="h-4 w-4 mr-2" />
                      )}
                      Mark as Shipped
                    </Button>
                  </div>
                )}

                {selectedOrder.status === 'shipped' && (
                  <div className="flex justify-end">
                    <Button
                      disabled={updating}
                      onClick={() =>
                        updateOrderStatus(selectedOrder.id, 'delivered')
                      }>
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Package className="h-4 w-4 mr-2" />
                      )}
                      Mark as Delivered
                    </Button>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowOrderDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
