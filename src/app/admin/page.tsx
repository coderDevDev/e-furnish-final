'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Users,
  Package,
  DollarSign,
  PackageSearch,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { format, subDays } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalOrders: 0,
    cancelledOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0
  });
  const [error, setError] = useState('');

  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch users count
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (usersError) throw usersError;

        // Fetch products count and low stock items
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*');

        if (productsError) throw productsError;

        const lowStock = products.filter(p => (p.stock || 0) < 10).length;

        // Fetch orders and calculate revenue
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*');

        if (ordersError) throw ordersError;

        const totalRevenue = orders.reduce(
          (sum, order) => sum + (order.total_amount || 0),
          0
        );
        const pendingOrders = orders.filter(
          order => order.status === 'pending'
        ).length;
        const processingOrders = orders.filter(
          order => order.status === 'processing'
        ).length;
        const completedOrders = orders.filter(
          order => order.status === 'completed'
        ).length;
        const cancelledOrders = orders.filter(
          order => order.status === 'cancelled'
        ).length;

        // Fetch recent orders with user details - Fixed relationship query
        const { data: recentOrdersData, error: recentOrdersError } =
          await supabase
            .from('orders')
            .select(
              `
            *,
            profiles!orders_user_id_fkey (
              full_name,
              email
            )
          `
            )
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentOrdersError) throw recentOrdersError;

        // Calculate sales data for the last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), i);
          const dateStr = format(date, 'yyyy-MM-dd');

          const dayOrders = orders.filter(
            order => order.created_at && order.created_at.startsWith(dateStr)
          );

          const dayRevenue = dayOrders.reduce(
            (sum, order) => sum + (order.total_amount || 0),
            0
          );

          return {
            date: format(date, 'MMM dd'),
            revenue: dayRevenue,
            orders: dayOrders.length
          };
        }).reverse();

        // Set all the state data
        setStats({
          totalUsers: usersCount || 0,
          totalProducts: products.length,
          totalRevenue,
          lowStockItems: lowStock,
          pendingOrders,
          completedOrders,
          totalOrders: orders.length,
          cancelledOrders
        });

        setRecentOrders(recentOrdersData);
        setSalesData(last7Days);
        setOrderStatusData({
          pending: pendingOrders,
          processing: processingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare chart data
  const salesChartData = {
    labels: salesData.map(d => d.date),
    datasets: [
      {
        label: 'Revenue (₱)',
        data: salesData.map(d => d.revenue),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)'
      }
    ]
  };

  const ordersChartData = {
    labels: salesData.map(d => d.date),
    datasets: [
      {
        label: 'Orders',
        data: salesData.map(d => d.orders),
        backgroundColor: 'rgba(255, 99, 132, 0.5)'
      }
    ]
  };

  const orderStatusChartData = {
    labels: ['Pending', 'Processing', 'Completed', 'Cancelled'],
    datasets: [
      {
        data: [
          orderStatusData.pending,
          orderStatusData.processing,
          orderStatusData.completed,
          orderStatusData.cancelled
        ],
        backgroundColor: [
          'rgba(255, 206, 86, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Dashboard stats cards
  const dashboardStats = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      change: '',
      color: 'bg-indigo-50 text-indigo-700'
    },
    {
      label: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      change: '',
      color: 'bg-blue-50 text-blue-700'
    },
    {
      label: 'Total Revenue',
      value: `₱${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: '',
      color: 'bg-green-50 text-green-700'
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      change: '',
      color: 'bg-purple-50 text-purple-700'
    },
    {
      label: 'Low Stock Items',
      value: stats.lowStockItems.toString(),
      icon: PackageSearch,
      change: '',
      color:
        stats.lowStockItems > 0
          ? 'bg-yellow-50 text-yellow-700'
          : 'bg-slate-50 text-slate-700'
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders.toString(),
      icon: Clock,
      change: '',
      color:
        stats.pendingOrders > 0
          ? 'bg-orange-50 text-orange-700'
          : 'bg-slate-50 text-slate-700'
    },
    {
      label: 'Completed Orders',
      value: stats.completedOrders.toString(),
      icon: CheckCircle,
      change: '',
      color: 'bg-emerald-50 text-emerald-700'
    },
    {
      label: 'Cancelled Orders',
      value: stats.cancelledOrders.toString(),
      icon: XCircle,
      change: '',
      color:
        stats.cancelledOrders > 0
          ? 'bg-red-50 text-red-700'
          : 'bg-slate-50 text-slate-700'
    }
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium text-gray-600">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-white">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map(stat => (
          <Card
            key={stat.label}
            className={`overflow-hidden border-none ${stat.color}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
                  {stat.change && (
                    <p className={`mt-1 text-sm font-medium`}>{stat.change}</p>
                  )}
                </div>
                <div className="rounded-full p-3">
                  <stat.icon size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Revenue (Last 7 Days)
            </h2>
            <div className="h-80">
              <Line
                data={salesChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: value => `₱${value}`
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Orders (Last 7 Days)</h2>
            <div className="h-80">
              <Bar
                data={ordersChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order Status Chart */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Order Status Distribution
            </h2>
            <div className="h-64 flex items-center justify-center">
              {orderStatusData.pending === 0 &&
              orderStatusData.processing === 0 &&
              orderStatusData.completed === 0 &&
              orderStatusData.cancelled === 0 ? (
                <p className="text-gray-500">No order data available</p>
              ) : (
                <Pie
                  data={orderStatusChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Recent Orders</h2>
            <div className="overflow-x-auto">
              {recentOrders.length === 0 ? (
                <p className="py-8 text-center text-gray-500">
                  No recent orders
                </p>
              ) : (
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-gray-500">
                      <th className="pb-2">Order ID</th>
                      <th className="pb-2">Customer</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} className="border-b text-sm">
                        <td className="py-3 font-medium">#{order.id}</td>
                        <td className="py-3">
                          {order.profiles?.full_name || 'Unknown'}
                        </td>
                        <td className="py-3">
                          ₱{order.total_amount?.toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {order.created_at
                            ? format(new Date(order.created_at), 'MMM dd, yyyy')
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
