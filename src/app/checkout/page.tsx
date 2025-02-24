'use client';

import { useAppSelector } from '@/lib/hooks/redux';
import { cn } from '@/lib/utils';
import { integralCF } from '@/styles/fonts';
import { Steps } from '@/components/checkout/Steps';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const { cart, totalPrice, adjustedTotalPrice } = useAppSelector(
    state => state.carts
  );

  if (!cart || cart.items.length === 0) {
    router.push('/cart');
    return null;
  }

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Handle order placement
      toast.success('Order placed successfully!');
      router.push('/thank-you');
    }
  };

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <h1
          className={cn([
            integralCF.className,
            'text-3xl md:text-4xl font-bold text-primary text-center my-8'
          ])}>
          Checkout
        </h1>

        <Steps currentStep={currentStep} />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {currentStep === 1 && <ShippingForm onNext={handleNextStep} />}
            {currentStep === 2 && <PaymentForm onNext={handleNextStep} />}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4">Review Order</h2>
                  {/* Show shipping and payment summaries */}
                  <Button
                    onClick={handleNextStep}
                    className="w-full mt-4 bg-primary">
                    Place Order
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <OrderSummary
              items={cart.items}
              totalPrice={totalPrice}
              adjustedTotalPrice={adjustedTotalPrice}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
