'use client';

import { useAppSelector, useAppDispatch } from '@/lib/hooks/redux';
import { CartItem } from '@/lib/features/carts/cartsSlice';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function OrderSummary() {
  const { items } = useAppSelector(state => state.carts);
  const address = useAppSelector(state => state.checkout.deliveryAddress);
  const shippingFee = useAppSelector(state => state.checkout.shippingFee);
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  const calculateTotals = () => {
    const itemTotals = items.reduce(
      (acc, item: CartItem) => {
        const itemPrice = item.product.price * item.quantity;
        const discountAmount =
          (itemPrice * (item.product.discount?.percentage || 0)) / 100;

        return {
          subtotal: acc.subtotal + itemPrice,
          discount: acc.discount + discountAmount,
          total: acc.total + (itemPrice - discountAmount)
        };
      },
      { subtotal: 0, discount: 0, total: 0 }
    );

    return {
      ...itemTotals,
      shippingFee,
      grandTotal: itemTotals.total + shippingFee
    };
  };

  const { subtotal, discount, grandTotal } = calculateTotals();

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
      <div className="space-y-2 mb-4">
        <h3 className="font-medium text-sm text-gray-500">Items in Order</h3>
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <div className="flex-1">
              <div className="font-medium">{item.product.name}</div>
              {item.product.customization && (
                <div className="text-xs text-gray-500">
                  {Object.entries(item.product.customization.fields || {})
                    .filter(([_, value]) => value)
                    .map(([key, value]) => (
                      <div key={key} className="truncate">
                        {key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, str => str.toUpperCase())}
                        : {value.toString()}
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div className="text-right whitespace-nowrap">
              <div>
                {item.quantity} × ₱{item.product.price.toLocaleString()}
              </div>
              <div>
                ₱
                {(item.quantity * item.product.price).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <hr className="border-black/10 mb-4" />
      <div className="space-y-4">
        <div className="flex justify-between text-black/60">
          <span>Subtotal</span>
          <span>
            ₱
            {subtotal.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>
              -₱
              {discount.toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
        )}

        <div className="flex justify-between text-black/60">
          <div className="flex items-center gap-2">
            <span>Shipping Fee:</span>
            {calculatingShipping && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </div>
          {!address ? (
            <span className="text-gray-400">
              Please enter delivery addresss
            </span>
          ) : (
            <span>
              {shippingFee === 0
                ? 'Free Shipping'
                : `₱${shippingFee.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}`}
            </span>
          )}
        </div>

        <hr className="border-black/10" />

        <div className="flex justify-between font-medium text-lg">
          <span>Total</span>
          <span>
            ₱
            {grandTotal.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
