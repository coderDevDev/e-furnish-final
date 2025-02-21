'use client';

import { useProducts } from '@/lib/hooks/useProducts';
import ProductListSec from './common/ProductListSec';

export default function ProductList() {
  const { data: products, isLoading } = useProducts();

  if (isLoading) return <div>Loading...</div>;

  return (
    <ProductListSec
      title="Products"
      data={products || []}
      viewAllLink="/shop"
    />
  );
}
