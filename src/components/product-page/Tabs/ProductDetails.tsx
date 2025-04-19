'use client';

import React, { useEffect, useState } from 'react';
import { productService } from '@/lib/services/productService';
import { Product } from '@/types/product.types';

export type SpecItem = {
  label: string;
  value: string;
};

const specsData: SpecItem[] = [
  {
    label: 'Material',
    value: 'Solid wood'
  },
  {
    label: 'Dimensions',
    value: '120cm x 60cm x 75cm'
  },
  {
    label: 'Weight capacity',
    value: '150kg'
  },
  {
    label: 'Assembly required',
    value: 'Yes'
  }
];

const ProductDetails = ({ productId }: { productId: string }) => {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const product = await productService.getProduct(productId);
      setProduct(product);
    };
    fetchProduct();
  }, [productId]);
  let description = product?.description;
  if (description && description.length > 100) {
    description = description.substring(0, 100) + '...';
  }
  return (
    <>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{product?.name}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </>
  );
};

export default ProductDetails;
