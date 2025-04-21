'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { notFound, redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import CreateOfferForm from '../../../components/CreateOfferForm';

type PageProps = {
  params: {
    id: string;
  };
};

export default function EditOfferPage({ params }: PageProps) {
  const { id } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [offerData, setOfferData] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAccess();
  }, [id]);

  const checkAccess = async () => {
    try {
      setIsLoading(true);

      // Check if user is logged in
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login
        window.location.href = `/login?redirect=/supplier/offers/${id}/edit`;
        return;
      }

      // Get supplier ID
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, status')
        .eq('user_id', user.id)
        .single();

      if (
        supplierError ||
        !supplierData ||
        supplierData.status !== 'approved'
      ) {
        redirect('/supplier/application-status');
        return;
      }

      // Check if offer exists and belongs to this supplier
      const { data: offer, error: offerError } = await supabase
        .from('supplier_offers')
        .select('*')
        .eq('id', id)
        .eq('supplier_id', supplierData.id)
        .single();

      if (offerError || !offer) {
        notFound();
        return;
      }

      setOfferData(offer);
    } catch (error) {
      console.error('Error checking access:', error);
      notFound();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!offerData) {
    return notFound();
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-2xl font-bold mb-6">Edit Offer</h1>
      <CreateOfferForm
        offerId={id}
        defaultValues={{
          title: offerData.title,
          description: offerData.description,
          price: offerData.price,
          discount_percentage: offerData.discount_percentage || 0,
          min_order_quantity: offerData.min_order_quantity,
          category: offerData.category,
          status: offerData.status,
          is_featured: offerData.is_featured || false
        }}
      />
    </div>
  );
}
