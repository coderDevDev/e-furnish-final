'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ThankYouPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      <h1 className="text-3xl font-bold mb-4">Thank You for Your Order!</h1>
      <p className="text-lg text-gray-600 mb-6">
        Your order has been placed successfully. Please check your email for the
        order confirmation.
      </p>
      <div className="flex space-x-4">
        <Button variant="outline" onClick={() => router.push('/shop')}>
          Continue Shopping
        </Button>
        <Button onClick={() => router.push('/orders')}>View Orders</Button>
      </div>
    </div>
  );
}
