'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function PaymentOptionsPage() {
  const [loading, setLoading] = useState(true);
  const [isApprovedSupplier, setIsApprovedSupplier] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkSupplierStatus();
  }, []);

  const checkSupplierStatus = async () => {
    try {
      setLoading(true);
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login?redirect=/supplier/payment-options';
        return;
      }

      const { data, error } = await supabase
        .from('suppliers')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (error || !data || data.status !== 'approved') {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
        Payment Options
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Configure Payment Methods</CardTitle>
          <CardDescription>
            Set up and manage how you receive payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Payment configuration features coming soon!</p>
          <p className="text-sm text-muted-foreground mt-2">
            You'll be able to set your accepted payment methods, payment terms,
            and connect payment accounts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
