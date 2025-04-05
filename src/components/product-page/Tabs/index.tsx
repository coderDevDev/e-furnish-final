'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import ProductDetailsContent from './ProductDetailsContent';
import ReviewsContent from './ReviewsContent';
import FaqContent from './FaqContent';
import { useParams } from 'next/navigation';

type TabBtn = {
  id: number;
  label: string;
};

const tabBtnData: TabBtn[] = [
  {
    id: 1,
    label: 'Product Details'
  },
  {
    id: 2,
    label: 'Rating & Reviews'
  },
  {
    id: 3,
    label: 'FAQs'
  }
];

interface TabsProps {
  productId: string;
}

const Tabs = ({ productId }: TabsProps) => {
  const [active, setActive] = useState<number>(1);
  // get the product id from the url
  // its like http://localhost:3000/shop/product/18

  console.log({ productId });

  return (
    <div>
      <div className="flex items-center mb-6 sm:mb-8 overflow-x-auto">
        {tabBtnData.map(tab => (
          <Button
            key={tab.id}
            variant="ghost"
            type="button"
            className={cn([
              active === tab.id
                ? 'border-black border-b-2 font-medium'
                : 'border-b border-black/10 text-black/60 font-normal',
              'p-5 sm:p-6 rounded-none flex-1'
            ])}
            onClick={() => setActive(tab.id)}>
            {tab.label}
          </Button>
        ))}
      </div>
      <div className="mb-12 sm:mb-16">
        {active === 1 && <ProductDetailsContent />}
        {active === 2 && <ReviewsContent productId={productId} />}
        {active === 3 && <FaqContent />}
      </div>
    </div>
  );
};

export default Tabs;
