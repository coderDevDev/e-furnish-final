'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus } from 'lucide-react';

export default function PaymentMethods() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Manage your payment methods</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-10">
          <CreditCard className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">No Payment Methods</h3>
          <p className="mt-1 text-center text-sm text-gray-500">
            Add a payment method for faster checkout
          </p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Method
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
