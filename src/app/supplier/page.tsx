'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/config';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Package,
  ShoppingCart,
  AlertCircle,
  TrendingUp,
  BarChart3,
  FileCheck,
  Clock,
  Clipboard,
  Truck,
  FileWarning,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { AreaChart, BarList } from '@tremor/react';

export default function SupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [supplierData, setSupplierData] = useState({
    offers: { total: 0, pending: 0, accepted: 0, rejected: 0 },
    license: { status: 'Pending', type: 'Not specified', expiryDate: null },
    revenue: { total: 0, thisMonth: 0, lastMonth: 0 },
    recentOffers: [],
    categories: []
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchSupplierData = async () => {
      try {
        // Get session with more detailed logging
        console.log('Checking for session...');
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();

        console.log('Raw session data:', session); // Log the full session object
        console.log('User info:', session?.user); // Log user info if available

        // If no session, redirect to login
        if (!session) {
          console.log('No session found, redirecting to login');
          toast.error('Please login to access your supplier dashboard');
          router.push('/login'); // Changed from /auth/login to match your route
          return;
        }

        // If we have a session, proceed with supplier data fetch
        console.log('Session found, user ID:', session.user.id);

        // Fetch supplier offers data
        console.log('Fetching supplier offers...');
        const { data: offers, error: offersError } = await supabase
          .from('supplier_offers')
          .select(
            'id, status, price_per_unit, quantity, material_name, category, description, unit, created_at, submitted_at'
          )
          .eq('supplier_id', session.user.id)
          .order('created_at', { ascending: false });

        console.log('Offers response:', {
          received: !!offers,
          count: offers?.length || 0,
          error: offersError
        });

        // Fetch license data
        const { data: license } = await supabase
          .from('licenses')
          .select('status, license_type, updated_at, created_at')
          .eq('user_id', session.user.id)
          .single();

        // Calculate monthly offer stats
        const now = new Date();
        const thisMonth = now.getMonth();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

        let thisMonthOffers = 0;
        let lastMonthOffers = 0;
        let totalValue = 0;

        const offersByMonth = Array(6).fill(0);

        offers?.forEach(offer => {
          // Calculate offer value
          const offerValue =
            (offer.price_per_unit || 0) * (offer.quantity || 0);
          totalValue += offerValue;

          const offerDate = new Date(offer.created_at);
          const monthDiff =
            now.getMonth() -
            offerDate.getMonth() +
            (now.getFullYear() - offerDate.getFullYear()) * 12;

          if (
            offerDate.getMonth() === thisMonth &&
            offerDate.getFullYear() === now.getFullYear()
          ) {
            thisMonthOffers += offerValue;
          } else if (
            offerDate.getMonth() === lastMonth &&
            (offerDate.getFullYear() === now.getFullYear() ||
              (lastMonth === 11 &&
                offerDate.getFullYear() === now.getFullYear() - 1))
          ) {
            lastMonthOffers += offerValue;
          }

          if (monthDiff >= 0 && monthDiff < 6) {
            offersByMonth[monthDiff] += offerValue;
          }
        });

        // Prepare chart data
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          months.push({
            month: format(d, 'MMM'),
            sales: offersByMonth[i]
          });
        }

        // Count offers by status
        const pendingOffers =
          offers?.filter(offer => offer.status === 'pending')?.length || 0;
        const acceptedOffers =
          offers?.filter(offer => offer.status === 'accepted')?.length || 0;
        const rejectedOffers =
          offers?.filter(offer => offer.status === 'rejected')?.length || 0;

        // Count offers by category
        const categoryCount = {};
        offers?.forEach(offer => {
          if (offer.category) {
            categoryCount[offer.category] =
              (categoryCount[offer.category] || 0) + 1;
          }
        });

        const categoryData = Object.entries(categoryCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        setSupplierData({
          offers: {
            total: offers?.length || 0,
            pending: pendingOffers,
            accepted: acceptedOffers,
            rejected: rejectedOffers
          },
          license: {
            status: license?.status || 'Pending',
            type: license?.license_type || 'Not specified',
            expiryDate: license?.updated_at
              ? new Date(license.updated_at)
              : null
          },
          revenue: {
            total: totalValue,
            thisMonth: thisMonthOffers,
            lastMonth: lastMonthOffers
          },
          recentOffers: offers || [],
          categories: categoryData
        });

        setChartData(months);
      } catch (error) {
        console.error('Error fetching supplier data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    );
  }

  const getStatusColor = status => {
    switch (status) {
      case 'Verified':
        return 'text-green-500';
      case 'Rejected':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const licenseStatusIcon = () => {
    switch (supplierData.license.status) {
      case 'Verified':
        return <FileCheck className="h-5 w-5 text-green-500" />;
      case 'Rejected':
        return <FileWarning className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
        Supplier Dashboard
      </h1>

      {/* Status Cards - with fixed styling */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Offers Card */}
        <Card
          className="relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg hover:translate-y-[-4px] border-0 shadow-md"
          style={{
            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)'
          }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-indigo-100/0 rounded-bl-full"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-indigo-900/70">
                  Total Offers
                </p>
                <p className="mt-2 text-3xl font-semibold text-indigo-900">
                  {supplierData.offers.total}
                </p>
              </div>
              <div
                className="rounded-xl p-3 shadow-sm"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
                <Clipboard className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span>Pending</span>
                </span>
                <span className="font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                  {supplierData.offers.pending}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-green-600" />
                  <span>Accepted</span>
                </span>
                <span className="font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  {supplierData.offers.accepted}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <FileWarning className="h-4 w-4 text-red-600" />
                  <span>Rejected</span>
                </span>
                <span className="font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  {supplierData.offers.rejected}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Status Card */}
        <Card
          className="relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg hover:translate-y-[-4px] border-0 shadow-md"
          style={{
            background:
              supplierData.license.status === 'Verified'
                ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
                : supplierData.license.status === 'Rejected'
                ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
                : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
          }}>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  License Status
                </p>
                <p
                  className={`mt-2 text-xl font-semibold ${
                    supplierData.license.status === 'Verified'
                      ? 'text-green-700'
                      : supplierData.license.status === 'Rejected'
                      ? 'text-red-700'
                      : 'text-amber-700'
                  }`}>
                  {supplierData.license.status}
                </p>
              </div>
              <div
                className={`rounded-xl p-3 shadow-sm ${
                  supplierData.license.status === 'Verified'
                    ? 'bg-green-100 text-green-600'
                    : supplierData.license.status === 'Rejected'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-yellow-100 text-yellow-600'
                }`}>
                {supplierData.license.status === 'Verified' ? (
                  <FileCheck className="h-6 w-6" />
                ) : supplierData.license.status === 'Rejected' ? (
                  <FileWarning className="h-6 w-6" />
                ) : (
                  <Clock className="h-6 w-6" />
                )}
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-white/80 p-3 shadow-sm">
              <p className="text-sm text-slate-500">License Type</p>
              <p className="font-medium truncate">
                {supplierData.license.type}
              </p>

              {supplierData.license.expiryDate && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <p className="text-sm text-slate-500">Last Updated</p>
                  <p className="font-medium">
                    {format(
                      new Date(supplierData.license.expiryDate),
                      'MMM dd, yyyy'
                    )}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Estimate Card */}
        <Card
          className="relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg hover:translate-y-[-4px] border-0 shadow-md"
          style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
          }}>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  Potential Revenue
                </p>
                <span className="block text-2xl font-bold text-blue-700">
                  ₱{supplierData.revenue.total.toLocaleString()}
                </span>
              </div>
              <div className="rounded-xl bg-blue-100 shadow-sm p-3 text-blue-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-white/80 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-600">This Month</span>
                <span className="text-green-600 font-medium">
                  ₱{supplierData.revenue.thisMonth.toLocaleString()}
                </span>
              </div>

              <Progress
                value={
                  supplierData.revenue.lastMonth
                    ? Math.min(
                        100,
                        Math.max(
                          0,
                          (supplierData.revenue.thisMonth /
                            supplierData.revenue.lastMonth) *
                            100
                        )
                      )
                    : 0
                }
                className="h-2 bg-blue-100"
              />

              <div className="flex items-center mt-3">
                <TrendingUp
                  className={`h-4 w-4 mr-1 ${
                    supplierData.revenue.thisMonth >
                    supplierData.revenue.lastMonth
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                />
                <span className="text-sm">
                  {supplierData.revenue.lastMonth ? (
                    <>
                      {Math.round(
                        ((supplierData.revenue.thisMonth -
                          supplierData.revenue.lastMonth) /
                          supplierData.revenue.lastMonth) *
                          100
                      )}
                      % vs last month
                    </>
                  ) : (
                    'No data for last month'
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg border-0 shadow-md bg-white">
          <CardContent className="pt-6 relative z-10">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Monthly Offer Value</h3>
              <p className="text-sm text-slate-500">
                Estimated revenue from offers over the last 6 months
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <AreaChart
                className="h-64"
                data={chartData}
                index="month"
                categories={['sales']}
                colors={['blue']}
                valueFormatter={value => `₱${value.toLocaleString()}`}
                showAnimation={true}
                showLegend={false}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg border-0 shadow-md bg-white">
          <CardContent className="pt-6 relative z-10">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Recent Offers</h3>
              <p className="text-sm text-slate-500">Latest material offers</p>
            </div>
            {supplierData.recentOffers.length > 0 ? (
              <div className="space-y-4">
                {supplierData.recentOffers.slice(0, 4).map(offer => (
                  <div
                    key={offer.id}
                    className="flex items-center space-x-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-primary/10 to-blue-50">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">
                        {offer.material_name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {offer.quantity} {offer.unit} • ₱{offer.price_per_unit}
                        /unit
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ₱
                        {(
                          offer.price_per_unit * offer.quantity
                        ).toLocaleString()}
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          offer.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : offer.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {offer.status}
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full transition-all hover:bg-primary/5 hover:border-primary/50">
                  <Clipboard className="mr-2 h-4 w-4" />
                  View All Offers
                </Button>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-white/80">
                <div className="text-center">
                  <Clipboard className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-2 text-lg font-medium">No offers yet</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Your material offers will appear here
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
