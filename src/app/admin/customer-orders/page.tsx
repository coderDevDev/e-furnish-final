'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  customerOrderService,
  OrderStats,
  OrderSummary
} from '@/lib/services/customerOrderService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Overview } from './components/Overview';
import { RecentOrders } from './components/RecentOrders';
import { OrderStatusChart } from './components/OrderStatusChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Search,
  X,
  ShoppingBag
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, isAfter, isBefore, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/config';

export default function CustomerOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for orders data
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // State for all orders listing
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderSummary[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get('status') || 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get('search') || ''
  );
  const [fromDate, setFromDate] = useState<Date | undefined>(
    searchParams.get('from')
      ? parseISO(searchParams.get('from') as string)
      : subDays(new Date(), 30)
  );
  const [toDate, setToDate] = useState<Date | undefined>(
    searchParams.get('to')
      ? parseISO(searchParams.get('to') as string)
      : new Date()
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch orders and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch order stats
        const fetchOrderStats = async () => {
          try {
            const { data: orders, error } = await supabase
              .from('orders')
              .select('*')
              .order('created_at', { ascending: false });

            if (error) throw error;

            // Count orders by status
            let totalOrders = orders.length;
            let pendingOrders = 0;
            let processingOrders = 0;
            let shippedOrders = 0; // Make sure this is initialized
            let completedOrders = 0;
            let cancelledOrders = 0;
            let totalRevenue = 0;

            orders.forEach(order => {
              if (order.status === 'pending') {
                pendingOrders++;
              } else if (order.status === 'processing') {
                processingOrders++;
              } else if (order.status === 'shipped') {
                shippedOrders++; // Count shipped orders properly
              } else if (
                order.status === 'delivered' ||
                order.status === 'completed'
              ) {
                completedOrders++;
                // Only count completed orders in revenue
                totalRevenue += order.total_amount;
              } else if (order.status === 'cancelled') {
                cancelledOrders++;
              }
            });

            // Make sure to include shipped in the stats object
            setStats({
              total: totalOrders,
              pending: pendingOrders,
              processing: processingOrders,
              shipped: shippedOrders, // Include this in the stats object
              completed: completedOrders,
              cancelled: cancelledOrders,
              totalRevenue
            });
          } catch (error) {
            console.error('Error fetching order stats:', error);
          }
        };

        await fetchOrderStats();

        // Fetch all orders - use the correct method name
        const allOrders = await customerOrderService.getOrders();
        setOrders(allOrders);
        setTotalOrders(allOrders.length);

        // Apply initial filters
        applyFilters(allOrders);
      } catch (error) {
        console.error('Error fetching order data:', error);
        toast.error('Failed to load order data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters whenever filter settings change
  useEffect(() => {
    applyFilters(orders);
    // Update URL with filter parameters
    updateUrlWithFilters();
  }, [statusFilter, searchQuery, fromDate, toDate, currentPage]);

  // Function to apply all filters
  const applyFilters = (ordersToFilter: OrderSummary[]) => {
    let result = [...ordersToFilter];

    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    // Filter by date range
    if (fromDate) {
      result = result.filter(order =>
        isAfter(new Date(order.created_at), new Date(fromDate))
      );
    }

    if (toDate) {
      // Add one day to include the to date fully
      const adjustedToDate = new Date(toDate);
      adjustedToDate.setDate(adjustedToDate.getDate() + 1);

      result = result.filter(order =>
        isBefore(new Date(order.created_at), adjustedToDate)
      );
    }

    // Filter by search query (order ID, customer name)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        order =>
          order.id.toString().includes(lowerQuery) ||
          order.profiles?.full_name?.toLowerCase().includes(lowerQuery)
      );
    }

    // Calculate total pages for pagination
    setTotalPages(Math.ceil(result.length / pageSize));

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedResult = result.slice(startIndex, startIndex + pageSize);

    setFilteredOrders(paginatedResult);
  };

  // Update URL with current filters
  const updateUrlWithFilters = () => {
    const params = new URLSearchParams();

    if (statusFilter && statusFilter !== 'all') {
      params.set('status', statusFilter);
    }

    if (searchQuery) {
      params.set('search', searchQuery);
    }

    if (fromDate) {
      params.set('from', format(fromDate, 'yyyy-MM-dd'));
    }

    if (toDate) {
      params.set('to', format(toDate, 'yyyy-MM-dd'));
    }

    params.set('page', currentPage.toString());

    // Replace the current URL with new parameters
    router.replace(`/admin/customer-orders?${params.toString()}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setFromDate(subDays(new Date(), 30));
    setToDate(new Date());
    setCurrentPage(1);
  };

  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  console.log({ filteredOrders });

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customer Orders</h2>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all-orders">All Orders</TabsTrigger>
          <TabsTrigger value="pending">
            Pending (
            {orders.filter(order => order.status === 'pending').length || 0})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processing (
            {orders.filter(order => order.status === 'processing').length || 0})
          </TabsTrigger>
          <TabsTrigger value="shipped">
            Shipped (
            {orders.filter(order => order.status === 'shipped').length || 0})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Delivered (
            {orders.filter(order => order.status === 'delivered').length || 0})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled (
            {orders.filter(order => order.status === 'cancelled').length || 0})
          </TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    stats?.total || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">All time orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    stats?.pending || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires fulfillment
                </p>
              </CardContent>
            </Card>
            {/* <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    `₱${stats?.totalRevenue.toLocaleString() || 0}`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  From all completed orders
                </p>
              </CardContent>
            </Card> */}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>
                  Order volume and revenue over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>
                  Distribution of order statuses
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center h-[300px]">
                <OrderStatusChart stats={stats} />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>The most recent customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentOrders />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-orders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Orders</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {filteredOrders.length} of {totalOrders} orders
                </span>
              </CardTitle>
              <CardDescription>
                View and manage all customer orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filter controls */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                  <form
                    onSubmit={handleSearch}
                    className="flex w-full max-w-sm items-center space-x-2">
                    <Input
                      type="search"
                      placeholder="Search order ID or customer name..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    <Button type="submit" size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>

                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-[130px] pl-3 text-left font-normal">
                            {fromDate ? (
                              format(fromDate, 'PPP')
                            ) : (
                              <span>From date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={fromDate}
                            onSelect={setFromDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-[130px] pl-3 text-left font-normal">
                            {toDate ? (
                              format(toDate, 'PPP')
                            ) : (
                              <span>To date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={toDate}
                            onSelect={setToDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Filter className="h-12 w-12 text-muted-foreground/60" />
                  <h3 className="mt-2 text-lg font-semibold">
                    No Orders Found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search query
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Products</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {console.log({ filteredOrders })}
                        {filteredOrders.map(order => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              #{order.id}
                            </TableCell>
                            <TableCell>
                              {order.profiles?.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {order.order_items &&
                              order.order_items.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  {order.order_items[0].products?.srcurl ? (
                                    <img
                                      src={
                                        order.order_items[0].products?.srcurl
                                      }
                                      alt={order.order_items[0].products.title}
                                      className="h-10 w-10 rounded-md object-cover border"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                      No img
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="font-medium truncate max-w-[150px]">
                                      {order.order_items[0].products.title}
                                    </span>
                                    {order.order_items.length > 1 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{order.order_items.length - 1} more
                                        items
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : order.enhanced_items &&
                                order.enhanced_items.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  {order.enhanced_items[0].product.srcurl ? (
                                    <img
                                      src={
                                        order.enhanced_items[0].product.srcurl
                                      }
                                      alt={
                                        order.enhanced_items[0].product.title
                                      }
                                      className="h-10 w-10 rounded-md object-cover border"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                      <ShoppingBag className="h-5 w-5" />
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="font-medium truncate max-w-[150px]">
                                      {order.enhanced_items[0].product.title}
                                    </span>
                                    {order.enhanced_items.length > 1 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{order.enhanced_items.length - 1} more
                                        items
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : order.items && order.items.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                    <ShoppingBag className="h-5 w-5" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium truncate max-w-[150px]">
                                      Product #{order.items[0].product_id} (₱
                                      {order.items[0].price})
                                    </span>
                                    {order.items.length > 1 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{order.items.length - 1} more items
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  No items
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {format(
                                new Date(order.created_at),
                                'MMM dd, yyyy'
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  order.status === 'completed' ||
                                  order.status === 'delivered'
                                    ? 'bg-green-500'
                                    : order.status === 'pending'
                                    ? 'bg-yellow-500'
                                    : order.status === 'processing'
                                    ? 'bg-blue-500'
                                    : order.status === 'shipped'
                                    ? 'bg-indigo-500'
                                    : 'bg-red-500'
                                }>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              ₱
                              {order.total_amount.toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/admin/customer-orders/${order.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * pageSize + 1} to{' '}
                      {Math.min(currentPage * pageSize, totalOrders)} of{' '}
                      {totalOrders} orders
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          // Logic to show appropriate page numbers
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={i}
                              variant={
                                currentPage === pageNum ? 'default' : 'outline'
                              }
                              size="sm"
                              className="w-9"
                              onClick={() => setCurrentPage(pageNum)}>
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(p => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab contents for specific statuses */}
        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(
          status => (
            <TabsContent key={status} value={status}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{status} Orders</CardTitle>
                  <CardDescription>
                    View and manage all {status} orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <OrderStatusTable
                      orders={orders.filter(order =>
                        status === 'delivered'
                          ? order.status === 'completed' ||
                            order.status === 'delivered'
                          : order.status === status
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        )}

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Generate and download order reports
              </CardDescription>
            </CardHeader>
            <CardContent>Coming soon...</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for displaying orders filtered by status
function OrderStatusTable({ orders }: { orders: OrderSummary[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Filter className="h-12 w-12 text-muted-foreground/60" />
        <h3 className="mt-2 text-lg font-semibold">No Orders Found</h3>
        <p className="text-muted-foreground">
          There are currently no orders with this status
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Total</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map(order => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">#{order.id}</TableCell>
            <TableCell>{order.profiles?.full_name || 'Unknown'}</TableCell>
            <TableCell>
              {order.order_items && order.order_items.length > 0 ? (
                <div className="flex items-center gap-2">
                  {order.order_items[0].products?.srcurl ? (
                    <img
                      src={order.order_items[0].products?.srcurl}
                      alt={order.order_items[0].products.title}
                      className="h-10 w-10 rounded-md object-cover border"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                      No img
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-[150px]">
                      {order.order_items[0].products.title}
                    </span>
                    {order.order_items.length > 1 && (
                      <span className="text-xs text-muted-foreground">
                        +{order.order_items.length - 1} more items
                      </span>
                    )}
                  </div>
                </div>
              ) : order.enhanced_items && order.enhanced_items.length > 0 ? (
                <div className="flex items-center gap-2">
                  {order.enhanced_items[0].product.srcurl ? (
                    <img
                      src={order.enhanced_items[0].product.srcurl}
                      alt={order.enhanced_items[0].product.title}
                      className="h-10 w-10 rounded-md object-cover border"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-[150px]">
                      {order.enhanced_items[0].product.title}
                    </span>
                    {order.enhanced_items.length > 1 && (
                      <span className="text-xs text-muted-foreground">
                        +{order.enhanced_items.length - 1} more items
                      </span>
                    )}
                  </div>
                </div>
              ) : order.items && order.items.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-[150px]">
                      Product #{order.items[0].product_id} (₱
                      {order.items[0].price})
                    </span>
                    {order.items.length > 1 && (
                      <span className="text-xs text-muted-foreground">
                        +{order.items.length - 1} more items
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">No items</span>
              )}
            </TableCell>
            <TableCell>
              {format(new Date(order.created_at), 'MMM dd, yyyy')}
            </TableCell>
            <TableCell>
              ₱
              {order.total_amount.toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/customer-orders/${order.id}`}>
                  View Details
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
