'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { format } from 'date-fns';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import {
  Search,
  FileText,
  Eye,
  Store,
  Calendar,
  Clock,
  Truck,
  Package2,
  CheckCircle,
  XCircle,
  Loader2,
  HistoryIcon
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { OrderTimeline } from '@/app/admin/customer-orders/components/OrderTimeline';

type OrderItem = {
  offer_id: string;
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  created_at: string;
  admin_id: string;
  supplier_id: string;
  order_items: OrderItem[];
  status:
    | 'pending'
    | 'approved'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'returned';
  total_amount: number;
  delivery_address: string;
  delivery_date: string;
  payment_terms: string;
  notes?: string;
  tracking_number?: string;
  updated_at: string;
};

type OrderHistoryProps = {
  supplierId?: string;
};

OrderHistory.defaultProps = {
  supplierId: '' // Empty string as fallback (will show no results)
};

export default function OrderHistory({ supplierId = '' }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription for order updates
    const channelId = supplierId ? `order-updates-${supplierId}` : 'all-orders';
    const filter = supplierId ? { filter: `supplier_id=eq.${supplierId}` } : {};

    const subscription = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supplier_orders',
          ...filter
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supplierId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // If supplierId is empty, fetch all orders
      let query = supabase
        .from('supplier_orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Only filter by supplier if supplierId is provided
      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      console.log({ data });
      setOrders(data as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    // Filter by search term
    const searchString = `${order.id}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());

    // Filter by status
    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const viewOrderDetails = (order: Order) => {
    console.log('View clicked for order:', order.id);
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const getStatusBadgeColor = (status: Order['status']) => {
    // Use the UI status label for color determination
    const uiStatus = mapDbStatusToUiStatus(status);

    switch (uiStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing': // This is 'approved' in the database
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTermsDisplay = (terms: string) => {
    switch (terms) {
      case 'cod':
        return 'Cash on Delivery';
      case '15_days':
        return 'Net 15 Days';
      case '30_days':
        return 'Net 30 Days';
      case '60_days':
        return 'Net 60 Days';
      default:
        return terms;
    }
  };

  const formatPaymentStatus = (status: Order['status']) => {
    // Convert database status to UI display label
    const uiStatus = mapDbStatusToUiStatus(status);
    return uiStatus.charAt(0).toUpperCase() + uiStatus.slice(1);
  };

  const mapUiStatusToDbStatus = (uiStatus: string): Order['status'] => {
    // Map UI labels to database values
    switch (uiStatus) {
      case 'processing':
        return 'approved';
      default:
        return uiStatus as Order['status'];
    }
  };

  const mapDbStatusToUiStatus = (dbStatus: Order['status']): string => {
    // Map database values to UI labels
    switch (dbStatus) {
      case 'approved':
        return 'processing';
      default:
        return dbStatus;
    }
  };

  const updateOrderStatus = async (orderId: string, uiStatus: string) => {
    if (updatingStatus) return;

    try {
      setUpdatingStatus(true);

      // Convert UI status to database status
      const dbStatus = mapUiStatusToDbStatus(uiStatus);

      // Update the order in Supabase with the correct database value
      const { error } = await supabase
        .from('supplier_orders')
        .update({
          status: dbStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Show success message with the UI status for user clarity
      toast.success(`Order status updated to ${uiStatus}`);

      // Update local state with database values
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? {
                ...order,
                status: dbStatus,
                updated_at: new Date().toISOString()
              }
            : order
        )
      );

      // Update selected order if it's the one being viewed
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: dbStatus,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        {/* <CardDescription>View orders</CardDescription> */}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex items-center">
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={statusFilter}
                onValueChange={value => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
              <HistoryIcon className="h-12 w-12 text-muted-foreground/60 mb-4" />
              <h3 className="text-lg font-semibold">No Orders Found</h3>
              <p className="text-muted-foreground max-w-sm">
                {orders.length === 0
                  ? "You don't have any past orders yet"
                  : 'No orders match your current filter settings'}
              </p>
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">
                      Order ID
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Total Amount
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        ₱{order.total_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(order.status)}>
                          {formatPaymentStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewOrderDetails(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {selectedOrder && (
          <Dialog
            open={showOrderDetails}
            onOpenChange={open => {
              console.log('Dialog open state changing to:', open);
              setShowOrderDetails(open);
              if (!open) {
                // Optionally reset selectedOrder when dialog closes
                // setSelectedOrder(null);
              }
            }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>
                  Order ID: {selectedOrder.id.slice(0, 8)}...
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Order Information
                    </h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Date:</span>
                        <span className="text-sm">
                          {format(new Date(selectedOrder.created_at), 'PPP')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge
                          className={getStatusBadgeColor(selectedOrder.status)}>
                          {formatPaymentStatus(selectedOrder.status)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">
                          Total Amount:
                        </span>
                        <span className="text-sm">
                          ₱{selectedOrder.total_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">
                          Payment Terms:
                        </span>
                        <span className="text-sm">
                          {selectedOrder.payment_terms}
                        </span>
                      </div>
                      {selectedOrder.tracking_number && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            Tracking Number:
                          </span>
                          <span className="text-sm">
                            {selectedOrder.tracking_number}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Delivery Information
                    </h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">
                          Delivery Date:
                        </span>
                        <span className="text-sm">
                          {format(new Date(selectedOrder.delivery_date), 'PPP')}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          Delivery Address:
                        </span>
                        <span className="text-sm mt-1">
                          {selectedOrder.delivery_address}
                        </span>
                      </div>
                      {selectedOrder.notes && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Notes:</span>
                          <span className="text-sm mt-1">
                            {selectedOrder.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Order Items
                  </h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.order_items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              ₱{item.price.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              ₱{(item.price * item.quantity).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="mt-6">
                  <Card className="border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Order Status
                      </CardTitle>
                      <CardDescription>
                        Current status and timeline
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <OrderTimeline status={selectedOrder.status} />
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">
                    Update Order Status
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['processing', 'shipped', 'delivered', 'cancelled'].map(
                      uiStatus => {
                        // Get the equivalent DB status for comparison
                        const dbStatus = mapUiStatusToDbStatus(uiStatus);

                        return (
                          <Button
                            key={uiStatus}
                            size="sm"
                            variant={
                              selectedOrder.status === dbStatus
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() =>
                              updateOrderStatus(selectedOrder.id, uiStatus)
                            }
                            disabled={
                              updatingStatus ||
                              selectedOrder.status === 'delivered' ||
                              selectedOrder.status === 'cancelled'
                            }>
                            {updatingStatus ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            ) : null}
                            {uiStatus.charAt(0).toUpperCase() +
                              uiStatus.slice(1)}
                          </Button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowOrderDetails(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
