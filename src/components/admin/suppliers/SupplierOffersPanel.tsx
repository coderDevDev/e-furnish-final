'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Package, Tag, Truck, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PlaceOrderModal from './PlaceOrderModal';

type Offer = {
  id: string;
  title: string;
  description: string;
  price: number;
  discount_percentage: number | null;
  min_order_quantity: number;
  stock_quantity: number;
  category: string;
  status: 'active' | 'inactive' | 'draft';
  is_featured: boolean;
  supplier_id: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

type SupplierOffersPanelProps = {
  supplierId: string;
  supplierName: string;
};

export default function SupplierOffersPanel({
  supplierId,
  supplierName
}: SupplierOffersPanelProps) {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchSupplierOffers();

    // Set up real-time subscription for offer changes
    const subscription = supabase
      .channel('supplier-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supplier_offers',
          filter: `supplier_id=eq.${supplierId}`
        },
        () => {
          fetchSupplierOffers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supplierId]);

  const fetchSupplierOffers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('supplier_offers')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setOffers(data as Offer[]);
    } catch (error) {
      console.error('Error fetching supplier offers:', error);
      toast.error('Failed to load supplier offers');
    } finally {
      setLoading(false);
    }
  };

  const openOrderModal = (offer: Offer) => {
    if (!offer) {
      console.error('Attempting to open order modal with undefined offer');
      toast.error('Error loading offer details');
      return;
    }
    setSelectedOffer(offer);
    setShowOrderModal(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200">
          Active
        </Badge>
      );
    } else if (status === 'inactive') {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Inactive
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-700 border-gray-200">
          Draft
        </Badge>
      );
    }
  };

  const calculateFinalPrice = (price: number, discount: number | null) => {
    if (!discount) return price;
    return price - (price * discount) / 100;
  };

  const renderOfferCards = (offersList: Offer[]) => {
    if (offersList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Offers Available</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            This supplier doesn't have any offers in this category yet.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offersList.map(offer => (
          <Card key={offer.id} className="overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {offer.image_url ? (
                <Image
                  src={offer.image_url}
                  alt={offer.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {offer.is_featured && (
                <Badge className="absolute top-2 left-2 bg-primary">
                  Featured
                </Badge>
              )}
              {offer.discount_percentage && offer.discount_percentage > 0 && (
                <Badge className="absolute top-2 right-2 bg-green-600">
                  {offer.discount_percentage}% OFF
                </Badge>
              )}
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="line-clamp-1">{offer.title}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {offer.category}
                  </CardDescription>
                </div>
                {getStatusBadge(offer.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="line-clamp-3 text-sm text-muted-foreground">
                {offer.description}
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">
                    ₱
                    {calculateFinalPrice(
                      offer.price,
                      offer.discount_percentage
                    ).toLocaleString()}
                  </p>
                  {offer.discount_percentage &&
                    offer.discount_percentage > 0 && (
                      <p className="text-sm text-muted-foreground line-through">
                        ₱{offer.price.toLocaleString()}
                      </p>
                    )}
                </div>
                <Button onClick={() => openOrderModal(offer)}>
                  Place Order
                </Button>
              </div>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Package className="h-3 w-3" />
                  <span>Available stock: {offer.stock_quantity} units</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-3 w-3" />
                  <span>Min. order: {offer.min_order_quantity} units</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const activeOffers = offers.filter(offer => offer.status === 'active');
  const allOffers = offers;

  const refreshOffers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_offers')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data);
    } catch (error) {
      console.error('Error refreshing offers:', error);
      toast.error('Failed to refresh offers');
    }
  }, [supplierId]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeOffers.length})
          </TabsTrigger>
          <TabsTrigger value="all">All Offers ({allOffers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="pt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : (
            renderOfferCards(activeOffers)
          )}
        </TabsContent>
        <TabsContent value="all" className="pt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : (
            renderOfferCards(allOffers)
          )}
        </TabsContent>
      </Tabs>

      {selectedOffer && (
        <PlaceOrderModal
          open={showOrderModal}
          onOpenChange={setShowOrderModal}
          offer={selectedOffer}
          supplierId={supplierId}
          supplierName={supplierName}
          onSuccess={() => {
            refreshOffers();
            setSelectedOffer(null);
          }}
        />
      )}
    </div>
  );
}
