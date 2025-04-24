'use client';

import React, { useEffect, useState } from 'react';
import { productService } from '@/lib/services/productService';
import { Product } from '@/types/product.types';

export type SpecItem = {
  label: string;
  value: string;
};

const ProductDetails = ({ productId }: { productId: string }) => {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.getProduct(productId);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product details:', error);
      }
    };

    fetchProduct();
  }, [productId]);

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="product-details p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">{product.name}</h2>
      <p className="text-sm text-gray-500 mb-6">{product.description}</p>

      <h3 className="text-xl font-semibold mb-2">Specifications</h3>
      <ul className="list-disc list-inside mb-6">
        {(product?.features || []).map((feature, index) => (
          <li key={index} className="text-sm text-gray-700">
            <strong>{feature.name}:</strong> {feature.value}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductDetails;
