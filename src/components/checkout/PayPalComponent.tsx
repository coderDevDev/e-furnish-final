'use client';

import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { toast } from 'sonner';
import { authService } from '@/lib/services/authService';
import { useAppSelector, useAppDispatch } from '@/lib/hooks/redux';
import { clearCart } from '@/lib/features/carts/cartsSlice';
import type { CartItem } from '@/lib/features/carts/cartsSlice';

interface PayPalComponentProps {
  amount: number;
  onSuccess?: () => void;
}

const PayPalComponent = ({ amount, onSuccess }: PayPalComponentProps) => {
  const { cart } = useAppSelector(state => state.carts);
  const dispatch = useAppDispatch();

  return (
    <PayPalScriptProvider
      options={{
        clientId:
          'AeOyoU1R7DSdegMaH-XLmmcOYywR83M3oMowvQE1-l3es9zbVfifqLodpD44m0uPCEgk3PLXu7DleiHw',
        currency: 'PHP'
      }}>
      <div className="w-full py-3">
        <PayPalButtons
          style={{
            layout: 'horizontal',
            color: 'gold',
            shape: 'rect',
            label: 'pay'
          }}
          createOrder={async (data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    currency_code: 'PHP',
                    value: amount.toString()
                  }
                }
              ]
            });
          }}
          onApprove={async (data, actions) => {
            if (!actions.order) return;

            try {
              const details = await actions.order.capture();

              // Get user profile
              const userProfile = await authService.getUserProfile();
              if (!userProfile?.user || !userProfile?.profile) {
                throw new Error('No user profile found');
              }

              // Create order items from cart
              const orderItems = cart?.items.map((item: CartItem) => ({
                product_id: item.product.id,
                quantity: item.quantity,
                price: item.product.price,
                customization: item.customization
              }));

              // Create the order
              await authService.createOrder({
                user_id: userProfile.user.id,
                items: orderItems,
                total_amount: amount,
                payment_method: 'paypal',
                payment_status: 'completed',
                shipping_address: userProfile.profile.address,
                transaction_id: details.id
              });

              // Clear the cart
              dispatch(clearCart());

              toast.success('Payment successful! Order placed.');
              onSuccess?.();
            } catch (error) {
              console.error('Payment error:', error);
              toast.error('Payment failed. Please try again.');
            }
          }}
          onError={err => {
            console.error('PayPal error:', err);
            toast.error('Payment failed. Please try again.');
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
};

export default PayPalComponent;
