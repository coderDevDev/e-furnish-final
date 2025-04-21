'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import CreateOfferForm from '../../components/CreateOfferForm';

export default function NewOfferPage() {
  const [isApprovedSupplier, setIsApprovedSupplier] = useState<boolean | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkSupplierStatus();
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
        window.location.href = '/login?redirect=/supplier/offers/new';
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Offer</h1>
      <CreateOfferForm />
    </div>
  );
}
