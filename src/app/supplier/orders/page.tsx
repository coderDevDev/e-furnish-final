'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import OrdersFromOwnerPanel from '../components/OrdersFromOwnerPanel';
import OrderHistoryCard from '../components/OrderHistoryCard';

export default function OrdersPage() {
  const [isApprovedSupplier, setIsApprovedSupplier] = useState<boolean | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [supplierId, setSupplierId] = useState<string>('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkSupplierStatus();
    getSupplierData();
  }, []);

  const checkSupplierStatus = async () => {
    try {
      setLoading(true);

      // Check if user is logged in
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login
        window.location.href = '/login?redirect=/supplier/orders';
        return;
      }

      // Check if approved supplier
      const { data, error } = await supabase
        .from('suppliers')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking supplier status:', error);
        setIsApprovedSupplier(false);

        // If not a supplier at all, redirect to registration
        if (error.code === 'PGRST116') {
          redirect('/supplier/register');
        }
        return;
      }

      // Check if approved
      if (data.status !== 'approved') {
        setIsApprovedSupplier(false);
        redirect('/supplier/application-status');
      } else {
        setIsApprovedSupplier(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSupplierData = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setSupplierId(data.id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!supplierId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Manage Orders</h1>
      <div className="space-y-6">
        {/* <OrdersFromOwnerPanel /> */}
        <OrderHistoryCard supplierId={supplierId} />
      </div>
    </div>
  );
}
