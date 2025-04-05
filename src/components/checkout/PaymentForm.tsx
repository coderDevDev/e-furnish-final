'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '@/lib/hooks/redux';
import { InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import PayPalComponent from './PayPalComponent';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import { clearCart } from '@/lib/features/carts/cartsSlice';
import type { CartItem } from '@/lib/features/carts/cartsSlice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';

const formSchema = z.object({
  paymentMethod: z.enum(['cod', 'paypal']),
  changeNeeded: z.string().optional()
});

type PaymentFormValues = z.infer<typeof formSchema>;

interface PaymentFormProps {
  onNext: () => void;
}

export function PaymentForm({ onNext }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const { items } = useAppSelector(state => state.carts);
  const shippingFee = useAppSelector(state => state.checkout.shippingFee);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const hasItems = items && items.length > 0;
  const calculateTotals = () => {
    if (!hasItems) return { subtotal: 0, discount: 0, total: 0 };

    const itemTotals = items.reduce(
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

    return {
      ...itemTotals,
      total: itemTotals.total + shippingFee
    };
  };

  const { total } = calculateTotals();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: 'cod'
    }
  });

  const selectedMethod = form.watch('paymentMethod');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!hasItems) return;

    setIsProcessing(true);
    try {
      const userProfile = await authService.getUserProfile();
      if (!userProfile) throw new Error('User profile not found');

      const orderItems = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        customization: item.product.customization
      }));

      const { data: order, error } = await authService.createOrder({
        user_id: userProfile.user.id,
        items: orderItems,
        total_amount: total,
        shipping_fee: shippingFee,
        payment_method: 'cod',
        payment_status: 'pending',
        shipping_address: userProfile.profile.address,
        change_needed: values.changeNeeded
          ? parseFloat(values.changeNeeded)
          : undefined
      });

      if (error) throw error;
      if (!order) throw new Error('Failed to create order');

      dispatch(clearCart());
      setPlacedOrderId(order.id);
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-4">
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="cod" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">💰</span>
                          <span>Cash on Delivery (COD)</span>
                          <HoverCard>
                            <HoverCardTrigger>
                              <InfoIcon className="h-4 w-4 text-gray-400" />
                            </HoverCardTrigger>
                            <HoverCardContent>
                              Pay in cash when your order arrives. Please
                              prepare the exact amount of ₱
                              {total.toLocaleString()}
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      </FormLabel>
                    </FormItem>

                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="paypal" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">💳</span>
                          <span>PayPal – Secure Online Payment</span>
                          <HoverCard>
                            <HoverCardTrigger>
                              <InfoIcon className="h-4 w-4 text-gray-400" />
                            </HoverCardTrigger>
                            <HoverCardContent>
                              Pay securely using your PayPal account or credit
                              card.
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedMethod === 'cod' ? (
            <>
              <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <AlertDescription>
                  Please prepare the exact amount of ₱{total.toLocaleString()}{' '}
                  upon delivery.
                </AlertDescription>
              </Alert>

              {/* <FormField
                control={form.control}
                name="changeNeeded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Need change for? (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount if you need change"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              <Button
                type="submit"
                className="w-full bg-primary"
                disabled={isProcessing}>
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  'Confirm Order'
                )}
              </Button>
            </>
          ) : (
            <div className="mt-4">
              <PayPalComponent amount={total} onSuccess={onNext} />
            </div>
          )}
        </form>
      </Form>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Order Placed Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Thank you for your order. We'll start processing it right away.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSuccessDialogOpen(false);
                  router.push('/shop');
                }}>
                Continue Shopping
              </Button>
              <Button
                onClick={() => {
                  setSuccessDialogOpen(false);
                  router.push(`/orders/${placedOrderId}`);
                }}>
                View Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
