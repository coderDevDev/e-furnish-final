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
  Loader2
} from 'lucide-react';

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
  status: 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
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
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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

  const formatPaymentStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const updateOrderStatus = async (
    orderId: string,
    status: Order['status']
  ) => {
    try {
      // In a real app, this would update your database
      setOrders(
        orders.map(order =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      toast.success(`Order status updated to ${status}`);

      // Close modal if open
      if (showOrderDetails) {
        setShowOrderDetails(false);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  // Single return statement for the component with conditional header
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        {!supplierId ? 'All Orders' : 'Order History'}
      </h2>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search orders..."
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">
            {!supplierId
              ? 'No orders found in the system.'
              : 'No orders found for this supplier.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>₱{order.total_amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(order.status)}>
                      {formatPaymentStatus(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
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
                      <span className="text-sm font-medium">Total Amount:</span>
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
    </div>
  );
}
