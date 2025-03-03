'use client';

import BreadcrumbCart from '@/components/cart-page/BreadcrumbCart';
import ProductCard from '@/components/cart-page/ProductCard';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/lib/hooks/redux';
import { useRouter } from 'next/navigation';
import { TbBasketExclamation } from 'react-icons/tb';
import Link from 'next/link';
import { CartItem } from '@/lib/features/carts/cartsSlice';

export default function CartPage() {
  const { items } = useAppSelector(state => state.carts);
  const router = useRouter();

  const hasItems = items && items.length > 0;

  // Calculate totals only for selected items
  const calculateTotals = () => {
    if (!hasItems) return { subtotal: 0, discount: 0, total: 0 };

    return items.reduce(
      (acc, item: CartItem) => {
        // Skip unselected items
        if (!item.selected) return acc;

        // Base price calculation
        const basePrice = item.product.price * item.quantity;

        // Add customization cost if any
        const customizationCost =
          (item.product.customization?.totalCustomizationCost || 0) *
          item.quantity;

        // Total item cost
        const itemTotal = basePrice + customizationCost;

        // Calculate discount
        const discountAmount =
          (itemTotal * (item.product.discount?.percentage || 0)) / 100;

        return {
          subtotal: acc.subtotal + itemTotal,
          discount: acc.discount + discountAmount,
          total: acc.total + (itemTotal - discountAmount)
        };
      },
      { subtotal: 0, discount: 0, total: 0 }
    );
  };

  const { subtotal, discount, total } = calculateTotals();

  // Check if any items are selected
  const hasSelectedItems = items.some(item => item.selected);

  return (
    <main className="container py-10">
      <div className="max-w-[1156px] mx-auto h-full">
        <BreadcrumbCart />
        {hasItems ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
              <div className="lg:col-span-2">
                <div className="">
                  {items.map((item, index) => (
                    <ProductCard
                      key={`${item.product.id}-${index}`}
                      data={item}
                      index={index}
                    />
                  ))}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl p-6 sticky top-4">
                  <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between text-black/60">
                      <span>Subtotal</span>
                      <span>₱{subtotal.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₱{discount.toLocaleString()}</span>
                      </div>
                    )}
                    <hr className="border-black/10" />
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span>₱{total.toLocaleString()}</span>
                    </div>
                    <Button
                      onClick={() => router.push('/checkout')}
                      disabled={!hasSelectedItems}
                      className="text-sm md:text-base font-medium bg-black rounded-full w-full py-4 h-[54px] md:h-[60px] group bg-primary disabled:opacity-50">
                      {hasSelectedItems
                        ? 'Proceed to Checkout'
                        : 'Select items to checkout'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center flex-col text-gray-300 mt-32">
            <TbBasketExclamation strokeWidth={1} className="text-6xl" />
            <span className="block mb-4">Your shopping cart is empty.</span>
            <Button className="rounded-full w-24" asChild>
              <Link href="/shop">Shop</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
