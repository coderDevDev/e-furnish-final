'use client';

import { useAppSelector } from '@/lib/hooks/redux';
import { CartItem } from '@/lib/features/carts/cartsSlice';
import { cn } from '@/lib/utils';

export default function OrderSummary() {
  const { items } = useAppSelector(state => state.carts);

  const calculateTotals = () => {
    return items.reduce(
      (acc, item: CartItem) => {
        const basePrice = item.product.price * item.quantity;
        const customizationCost =
          item.product.customization?.totalCustomizationCost || 0;
        const itemTotal = basePrice + customizationCost;
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

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
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
      </div>
    </div>
  );
}
