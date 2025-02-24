'use client';

import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { productService } from '@/lib/services/productService';

const PriceSection = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [maxAvailablePrice, setMaxAvailablePrice] = useState(250000);
  const [priceRange, setPriceRange] = useState([0, maxAvailablePrice]);
  const debouncedPriceRange = useDebounce(priceRange, 500);

  // Get max price and initial price range from URL on mount
  useEffect(() => {
    const loadMaxPrice = async () => {
      try {
        const maxPrice = await productService.getMaxPrice();
        setMaxAvailablePrice(maxPrice);

        // Get initial price range from URL or use defaults
        const minPrice = Number(searchParams.get('minPrice')) || 0;
        //  const maxPrice = Number(searchParams.get('maxPrice')) || maxPrice;
        setPriceRange([minPrice, maxPrice]);
      } catch (error) {
        console.error('Error loading max price:', error);
      }
    };

    loadMaxPrice();
  }, []);

  // Update URL when price range changes (debounced)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('minPrice', debouncedPriceRange[0].toString());
    params.set('maxPrice', debouncedPriceRange[1].toString());

    router.push(`${pathname}?${params.toString()}`);
  }, [debouncedPriceRange]);

  const handlePriceChange = (values: number[]) => {
    setPriceRange(values);
  };

  return (
    <Accordion type="single" collapsible defaultValue="filter-price">
      <AccordionItem value="filter-price" className="border-none">
        <AccordionTrigger className="text-primary font-bold text-xl hover:no-underline p-0 py-0.5">
          Price Range
        </AccordionTrigger>
        <AccordionContent className="pt-4" contentClassName="overflow-visible">
          <Slider
            value={priceRange}
            min={0}
            max={maxAvailablePrice}
            step={1000}
            onValueChange={handlePriceChange}
          />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>₱{priceRange[0].toLocaleString()}</span>
            <span>₱{priceRange[1].toLocaleString()}</span>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default PriceSection;
