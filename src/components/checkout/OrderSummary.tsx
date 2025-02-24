'use client';

import { useAppSelector } from '@/lib/hooks/redux';
import { cn } from '@/lib/utils';

interface CartItem {
  product: {
    id: number;
    title: string;
    srcurl: string;
    price: number;
    discount: {
      percentage: number;
    };
  };
  quantity: number;
  customization?: {
    dimensions: {
      size: number;
    };
    addons: Array<{
      id: string;
      name: string;
      category: string;
      unit: string;
      quantity: number;
      price: number;
    }>;
    totalCustomizationCost: number;
  };
}

export default function OrderSummary() {
  const { cart } = useAppSelector(state => state.carts);

  const calculateTotals = () => {
    if (!cart?.items.length) return { subtotal: 0, discount: 0, total: 0 };

    return cart.items.reduce(
      (acc, item: CartItem) => {
        // Base price calculation
        const basePrice = item.product.price * item.quantity;

        // Add customization cost if any
        const customizationCost =
          item.customization?.totalCustomizationCost || 0;

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

  return (
    <div className="bg-white rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
      <div className="space-y-4">
        {cart?.items.map((item: CartItem, index) => (
          <div
            key={`${item.product.id}-${index}`}
            className="flex justify-between text-sm">
            <div className="flex-1">
              <span className="block font-medium">{item.product.title}</span>
              <span className="text-black/60">Quantity: {item.quantity}</span>
              {item.customization && (
                <div className="text-black/60 space-y-1">
                  {item.customization.dimensions && (
                    <span className="block">
                      Size: {item.customization.dimensions.size}cm
                    </span>
                  )}
                  {item.customization.addons.length > 0 && (
                    <div>
                      <span className="block">Add-ons:</span>
                      <ul className="ml-4">
                        {item.customization.addons.map(addon => (
                          <li key={addon.id}>
                            {addon.name} ({addon.quantity} {addon.unit}
                            {addon.quantity > 1 ? 's' : ''})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <span>
              ₱
              {(
                item.product.price * item.quantity +
                (item.customization?.totalCustomizationCost || 0)
              ).toLocaleString()}
            </span>
          </div>
        ))}
        <hr className="border-black/10" />
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
