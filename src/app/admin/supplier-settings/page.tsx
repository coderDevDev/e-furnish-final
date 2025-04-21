'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import SupplierApplicationsList from '@/components/admin/suppliers/SupplierApplicationsList';
import ApprovedSuppliersList from '@/components/admin/suppliers/ApprovedSuppliersList';
import OrderHistory from '@/components/admin/suppliers/OrderHistory';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SupplierSettingsPage() {
  const [activeTab, setActiveTab] = useState('applications');
  const [applicationCount, setApplicationCount] = useState(0);
  const supabase = createClientComponentClient();
  // Fetch pending application count for badge
  useEffect(() => {
    const fetchApplicationCount = async () => {
      const { count } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      if (count !== null) {
        setApplicationCount(count);
      }
    };

    fetchApplicationCount();

    // Set up real-time subscription
    const subscription = supabase
      .channel('supplier-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'suppliers',
          filter: 'status=eq.pending'
        },
        () => {
          fetchApplicationCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Supplier Management</h1>

      <Tabs defaultValue="applications" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="applications" className="relative">
            Applications
            {applicationCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {applicationCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved Suppliers</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Applications</CardTitle>
              <CardDescription>
                Review and manage pending supplier applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupplierApplicationsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Suppliers</CardTitle>
              <CardDescription>
                View and manage approved suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApprovedSuppliersList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>
                Track orders placed with suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
