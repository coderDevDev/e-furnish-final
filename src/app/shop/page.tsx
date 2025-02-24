'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import BreadcrumbShop from '@/components/shop-page/BreadcrumbShop';
import MobileFilters from '@/components/shop-page/filters/MobileFilters';
import Filters from '@/components/shop-page/filters';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import ProductCard from '@/components/common/ProductCard';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { productService } from '@/lib/services/productService';
import { Product } from '@/types/product.types';
import { toast } from 'sonner';

export default function ShopPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const category = searchParams.get('category');
  const itemsPerPage = 12;

  useEffect(() => {
    loadProducts();
  }, [debouncedSearch, category, sortBy, currentPage]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { products, total } = await productService.getProducts({
        category,
        searchTerm: debouncedSearch,
        sortBy,
        page: currentPage,
        itemsPerPage
      });

      setProducts(products);
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 sm:py-9 max-w-[1200px] mx-auto">
      {/* <BreadcrumbShop /> */}
      <div className="flex items-center justify-end mb-5 sm:mb-9">
        <div className="flex items-center space-x-2 mr-2">
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <MobileFilters />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-12 gap-5 sm:gap-9">
        <div className="hidden md:block col-span-3">
          <Filters />
        </div>
        <div className="col-span-12 md:col-span-9">
          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">No Products Found</h2>
              <p className="text-gray-600">
                Try adjusting your search or filters to find what you're looking
                for.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map(product => (
                  <ProductCard key={product.id} data={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}>
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(page)}>
                        {page}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage(p => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
