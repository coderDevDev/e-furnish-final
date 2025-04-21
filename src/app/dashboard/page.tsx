import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { TrendingUp, DollarSign } from 'lucide-react';

async function TotalRevenueCard({ supplierId = null }) {
  const supabase = createServerComponentClient({ cookies });

  // Get current date and date 30 days ago for comparing
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Previous 30 days for comparison
  const sixtyDaysAgo = new Date(thirtyDaysAgo);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 30);

  let query = supabase
    .from('supplier_orders')
    .select('total_amount, created_at')
    .gte('status', 'delivered') // Only count completed orders
    .lt('created_at', today.toISOString());

  // If we're on supplier dashboard, filter by supplier ID
  if (supplierId) {
    query = query.eq('supplier_id', supplierId);
  }

  const { data: allOrders, error } = await query;

  if (error) {
    console.error('Error fetching revenue data:', error);
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Error</div>
          <p className="text-xs text-muted-foreground">
            Could not load revenue data
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate total revenue from all time
  const totalRevenue = allOrders.reduce(
    (sum, order) => sum + (parseFloat(order.total_amount) || 0),
    0
  );

  // Calculate revenue for last 30 days
  const recentOrders = allOrders.filter(
    order => new Date(order.created_at) >= thirtyDaysAgo
  );

  const recentRevenue = recentOrders.reduce(
    (sum, order) => sum + (parseFloat(order.total_amount) || 0),
    0
  );

  // Calculate revenue for previous 30 days
  const previousOrders = allOrders.filter(
    order =>
      new Date(order.created_at) >= sixtyDaysAgo &&
      new Date(order.created_at) < thirtyDaysAgo
  );

  const previousRevenue = previousOrders.reduce(
    (sum, order) => sum + (parseFloat(order.total_amount) || 0),
    0
  );

  // Calculate percentage change
  const percentChange =
    previousRevenue === 0
      ? 100
      : ((recentRevenue - previousRevenue) / previousRevenue) * 100;

  const isPositiveChange = percentChange >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ₱{totalRevenue.toLocaleString()}
        </div>
        <div className="flex items-center pt-1">
          <span
            className={`text-xs ${
              isPositiveChange ? 'text-green-500' : 'text-red-500'
            }`}>
            {isPositiveChange ? '+' : ''}
            {percentChange.toFixed(1)}%
          </span>
          <TrendingUp
            className={`h-3 w-3 ml-1 ${
              isPositiveChange ? 'text-green-500' : 'text-red-500'
            }`}
          />
          <span className="text-xs text-muted-foreground ml-1">
            vs previous period
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Last 30 days: ₱{recentRevenue.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  // For admin dashboard
  return <TotalRevenueCard />;

  // OR for supplier dashboard, first get supplier ID
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return <div>Please log in</div>;

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!supplier) return <div>Supplier not found</div>;

  return <TotalRevenueCard supplierId={supplier.id} />;
}
