'use client';

import { useEffect, useState } from 'react';
import {
  customerOrderService,
  OrderStats
} from '@/lib/services/customerOrderService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Overview } from './components/Overview';
import { RecentOrders } from './components/RecentOrders';
import { OrderStatusChart } from './components/OrderStatusChart';
import {
  Loader2,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShoppingBag
} from 'lucide-react';

export default function CustomerOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const orderStats = await customerOrderService.getOrderStats();
      setStats(orderStats);
    } catch (error) {
      console.error('Error loading order stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.total || 0,
      icon: ShoppingBag,
      description: 'All time orders',
      className: 'bg-blue-50'
    },
    {
      title: 'Pending',
      value: stats?.pending || 0,
      icon: Clock,
      description: 'Awaiting processing',
      className: 'bg-yellow-50'
    },
    {
      title: 'Processing',
      value: stats?.processing || 0,
      icon: Package,
      description: 'Currently processing',
      className: 'bg-purple-50'
    },
    {
      title: 'Completed',
      value: stats?.completed || 0,
      icon: CheckCircle2,
      description: 'Successfully delivered',
      className: 'bg-green-50'
    },
    {
      title: 'Cancelled',
      value: stats?.cancelled || 0,
      icon: XCircle,
      description: 'Order cancellations',
      className: 'bg-red-50'
    },
    {
      title: 'Returned',
      value: stats?.returned || 0,
      icon: RotateCcw,
      description: 'Product returns',
      className: 'bg-orange-50'
    }
  ];

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customer Orders</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map(card => (
          <Card key={card.title} className={card.className}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-primary text-white">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {/* <TabsTrigger value="analytics">Analytics</TabsTrigger> */}
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue from orders</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>
                  Current order status breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrderStatusChart stats={stats} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest customer orders and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentOrders />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Detailed analysis of order trends and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>Coming soon...</CardContent>
          </Card>
        </TabsContent>

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
