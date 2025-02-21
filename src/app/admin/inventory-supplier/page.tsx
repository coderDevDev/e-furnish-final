'use client';

import { useEffect, useState } from 'react';
import { productService } from '@/lib/services/productService';
import type { Product } from '@/types/product.types';
import InventoryManagement from './InventoryManagement';

export default function InventorySupplierPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="">
      <InventoryManagement products={products} fetchProducts={fetchProducts} />
    </div>
  );
}
