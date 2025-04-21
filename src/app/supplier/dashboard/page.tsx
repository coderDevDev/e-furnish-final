'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Truck, BarChart3, DollarSign } from 'lucide-react';
import OrdersFromOwnerPanel from '../components/OrdersFromOwnerPanel';
import Link from 'next/link';

export default function SupplierDashboard() {
  const [stats, setStats] = useState({
    totalOffers: 0,
    activeOffers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch supplier ID
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!supplierData) return;

      // Fetch offers count
      const { count: totalOffers } = await supabase
        .from('supplier_offers')
        .select('*', { count: 'exact' })
        .eq('supplier_id', supplierData.id);

      // Fetch active offers count
      const { count: activeOffers } = await supabase
        .from('supplier_offers')
        .select('*', { count: 'exact' })
        .eq('supplier_id', supplierData.id)
        .eq('status', 'active');

      // Fetch pending orders count
      const { count: pendingOrders } = await supabase
        .from('supplier_orders')
        .select('*', { count: 'exact' })
        .eq('supplier_id', supplierData.id)
        .eq('status', 'pending');

      // Fetch completed orders count
      const { count: completedOrders } = await supabase
        .from('supplier_orders')
        .select('*', { count: 'exact' })
        .eq('supplier_id', supplierData.id)
        .eq('status', 'delivered');

      // Fetch total revenue (from delivered orders)
      const { data: revenueData } = await supabase
        .from('supplier_orders')
        .select('total_amount')
        .eq('supplier_id', supplierData.id)
        .eq('status', 'delivered');

      const totalRevenue = revenueData
        ? revenueData.reduce((sum, order) => sum + (order.total_amount || 0), 0)
        : 0;

      setStats({
        totalOffers: totalOffers || 0,
        activeOffers: activeOffers || 0,
        pendingOrders: pendingOrders || 0,
        completedOrders: completedOrders || 0,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Supplier Dashboard</h1>
        <Button asChild>
          <Link href="/supplier/offers/new">Create New Offer</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">
                {loading ? '—' : stats.totalOffers}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-2xl font-bold">
                {loading ? '—' : stats.activeOffers}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Truck className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-2xl font-bold">
                {loading ? '—' : stats.pendingOrders}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-emerald-500 mr-2" />
              <span className="text-2xl font-bold">
                {loading ? '—' : `₱${stats.totalRevenue.toLocaleString()}`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        <OrdersFromOwnerPanel />
      </div>
    </div>
  );
}
