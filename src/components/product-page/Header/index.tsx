'use client';

import React, { useState, useEffect } from 'react';
import PhotoSection from './PhotoSection';
import { Product } from '@/types/product.types';
import { integralCF } from '@/styles/fonts';
import { cn } from '@/lib/utils';
import Rating from '@/components/ui/Rating';
import ColorSelection from './ColorSelection';
import SizeSelection from './SizeSelection';
import AddToCardSection from './AddToCardSection';
import {
  CustomizationOptions,
  type ProductCustomization
} from './CustomizationOptions';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Pencil, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useAppDispatch } from '@/lib/hooks/redux';
import { addToCart } from '@/lib/store/slices/cartSlice';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FIRST_DISTRICT_MUNICIPALITIES } from '@/lib/utils/shipping';
import { customizationService } from '@/lib/services/customizationService';
import { supabase } from '@/lib/supabase/config';

const Header = ({ data }: { data: Product }) => {
  const [customization, setCustomization] =
    useState<ProductCustomization | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [isDownpaymentMode, setIsDownpaymentMode] = useState(false);
  const [customizationOptions, setCustomizationOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();

  if (!data.discount) {
    data.discount = { percentage: 0, amount: 0 };
  }

  useEffect(() => {
    const fetchCustomizationOptions = async () => {
      if (!data.id) return;

      try {
        setIsLoading(true);
        const options =
          await customizationService.getProductCustomizationOptions(data.id);
        setCustomizationOptions(options || []);
      } catch (error) {
        console.error('Error fetching customization options:', error);
        // Don't show error toast to avoid confusion on product page
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomizationOptions();
  }, [data.id]);

  const handleCustomizationChange = (
    newCustomization: ProductCustomization
  ) => {
    setCustomization(newCustomization);
  };

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        id: data.id,
        name: data.name,
        srcUrl: data.srcUrl,
        price: data.price,
        attributes: data.attributes,
        discount: data.discount,
        quantity: 1
      })
    );
    toast.success('Added to cart!');
  };

  const calculateDownpayment = () => {
    return Math.round(data.price * 0.3); // 30% downpayment
  };

  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchAverageRating = async () => {
      // Calculate average rating
      const { data: ratingData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', data.id)
        .eq('status', 'published');

      console.log({ data });

      if (ratingData && ratingData.length > 0) {
        const sum = ratingData.reduce((acc, curr) => acc + curr.rating, 0);
        setAverageRating(parseFloat((sum / ratingData.length).toFixed(1)));
      } else {
        setAverageRating(0);
      }
    };
    fetchAverageRating();
  }, [data.id]);

  console.log({ data });
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <PhotoSection data={data} />
        </div>
        <div>
          <h1
            className={cn([
              'text-2xl md:text-[40px] md:leading-[40px] mb-3 md:mb-3.5 font-bold'
            ])}>
            {data.title}
          </h1>
          <div className="flex items-center mb-3 sm:mb-3.5">
            <Rating
              initialValue={averageRating}
              allowFraction
              SVGclassName="inline-block"
              emptyClassName="fill-gray-50"
              size={25}
              readonly
            />
            <span className="ml-2 text-sm text-gray-600">
              ({data.totalReviews || 0} reviews)
            </span>
          </div>
          <div className="flex items-center space-x-2.5 sm:space-x-3 mb-5">
            {data.discount.percentage > 0 ? (
              <span className="font-bold text-black text-2xl sm:text-[32px]">
                {`$${Math.round(
                  data.price - (data.price * data.discount.percentage) / 100
                )}`}
              </span>
            ) : data.discount.amount > 0 ? (
              <span className="font-bold text-black text-2xl sm:text-[32px]">
                {`$${data.price - data.discount.amount}`}
              </span>
            ) : (
              <span className="font-bold text-black text-2xl sm:text-[32px]">
                ₱{data.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </span>
            )}
            {data.discount.percentage > 0 && (
              <span className="font-bold text-black/40 line-through text-2xl sm:text-[32px]">
                ₱{data.price}
              </span>
            )}
            {data.discount.amount > 0 && (
              <span className="font-bold text-black/40 line-through text-2xl sm:text-[32px]">
                ₱{data.price}
              </span>
            )}
            {data.discount.percentage > 0 ? (
              <span className="font-medium text-[10px] sm:text-xs py-1.5 px-3.5 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
                {`-${data.discount.percentage}%`}
              </span>
            ) : (
              data.discount.amount > 0 && (
                <span className="font-medium text-[10px] sm:text-xs py-1.5 px-3.5 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
                  {`-$${data.discount.amount}`}
                </span>
              )
            )}
          </div>
          <p className="text-sm sm:text-base text-black/60 mb-5">
            {data.description}
          </p>
          {/* <hr className="h-[1px] border-t-black/10 mb-5" /> */}
          {/* <ColorSelection /> */}
          {/* <hr className="h-[1px] border-t-black/10 my-5" /> */}
          {/* <SizeSelection /> */}
          {/* <hr className="hidden md:block h-[1px] border-t-black/10 my-5" /> */}
          {/* <CustomizationOptions
            onCustomizationChange={handleCustomizationChange}
          /> */}
          <hr className="hidden md:block h-[1px] border-t-black/10 my-5" />
          <AddToCardSection
            data={data}
            customization={customization}
            handleCustomizationChange={handleCustomizationChange}
          />
          {/* <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary/10">
                <Pencil className="w-4 h-4 mr-2" />
                Customize
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] p-0">
              <ScrollArea className="h-full max-h-[calc(90vh-2rem)]">
                <div className="p-6">
                  <DialogHeader>
                    <DialogTitle>Customize Your Order</DialogTitle>
                    <DialogDescription>
                      Personalize your item with custom options
                    </DialogDescription>
                  </DialogHeader>
                  <CustomizationOptions
                    onCustomizationChange={handleCustomizationChange}
                    initialCustomization={customization}
                  />
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog> */}
          {/* <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-primary/50 text-primary hover:bg-primary/5">
                <Clock className="w-4 h-4 mr-2" />
                Made to Order (30% Downpayment)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Made to Order</DialogTitle>
                <DialogDescription>
                  Secure your custom order with a 30% downpayment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Price:</span>
                  <span className="font-semibold">
                    ₱{data.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Required Downpayment (30%):</span>
                  <span className="font-semibold">
                    ₱{calculateDownpayment().toLocaleString()}
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    toast.success('Proceeding to downpayment...');
                  }}>
                  Proceed with Downpayment
                </Button>
              </div>
            </DialogContent>
          </Dialog> */}
          <div className="mt-4 text-sm text-gray-600">
            <p>
              <span className="font-medium">Shipping:</span> Free shipping to
              Camarines Sur (First District:{' '}
              {FIRST_DISTRICT_MUNICIPALITIES.join(', ')}). ₱500.00 flat rate for
              all other areas.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
