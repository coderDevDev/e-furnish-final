'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import ProductModal from '@/components/admin/products/ProductModal';
import { productService } from '@/services/productService';
import { Product } from '@/types/product.types';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to fetch products');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle product creation/update
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (selectedProduct) {
        // Update existing product
        await productService.updateProduct(selectedProduct.id, productData);
        toast.success('Product updated successfully');
      } else {
        // Create new product
        await productService.createProduct(productData);
        toast.success('Product created successfully');
      }
      fetchProducts(); // Refresh the list
      setIsModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error('Failed to save product');
      console.error(error);
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(id);
        toast.success('Product deleted successfully');
        fetchProducts(); // Refresh the list
      } catch (error) {
        toast.error('Failed to delete product');
        console.error(error);
      }
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 rounded-xl bg-primary px-4 py-2 text-white hover:bg-primary/90 transition-colors">
          <Plus size={20} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button className="flex items-center space-x-2 rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50 transition-colors">
          <Filter size={20} />
          <span>Filters</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                  Rating
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                  Sales
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr
                  key={product.id}
                  className="border-b border-slate-200 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100">
                        <img
                          src={product.srcurl}
                          alt={product.title}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      </div>
                      <span className="font-medium text-slate-900">
                        {product.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {product.category}
                  </td>
                  <td className="px-4 py-3 text-slate-600">₱{product.price}</td>
                  <td className="px-4 py-3 text-slate-600">{product.rating}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {product.salesCount}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {product.createdAt}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing <span className="font-medium">1</span> to{' '}
          <span className="font-medium">10</span> of{' '}
          <span className="font-medium">100</span> results
        </p>
        <div className="flex items-center space-x-2">
          <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
            <ChevronLeft size={20} />
          </button>
          <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleSaveProduct}
        product={selectedProduct}
      />
    </div>
  );
}
