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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  paymentMethod: z.enum(['cod', 'paypal']),
  changeNeeded: z.string().optional()
});

type PaymentFormValues = z.infer<typeof formSchema>;

interface PaymentFormProps {
  onNext: () => void;
  totalAmount: number;
}

export function PaymentForm({ onNext, totalAmount }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: 'cod'
    }
  });

  const selectedMethod = form.watch('paymentMethod');

  async function onSubmit(values: PaymentFormValues) {
    try {
      setIsProcessing(true);

      if (values.paymentMethod === 'paypal') {
        // Handle PayPal payment
        // This would integrate with your PayPal implementation
        console.log('Processing PayPal payment...');
      } else {
        // Handle COD
        console.log('Processing COD order...');
      }

      onNext();
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  }

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
                              prepare the exact amount of ₱{totalAmount}
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
                              card. You'll be redirected to PayPal to complete
                              your payment.
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

          {selectedMethod === 'cod' && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <AlertDescription>
                  Please prepare the exact amount of ₱{totalAmount} upon
                  delivery.
                </AlertDescription>
              </Alert>

              <FormField
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
              />
            </div>
          )}

          <Button
            type="submit"
            className={cn(
              'w-full bg-primary',
              selectedMethod === 'paypal' &&
                'bg-[#0070BA] hover:bg-[#003087] text-white'
            )}
            disabled={isProcessing}>
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : selectedMethod === 'paypal' ? (
              'Proceed to PayPal'
            ) : (
              'Confirm Order'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
