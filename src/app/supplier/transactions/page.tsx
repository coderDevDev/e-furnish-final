'use client';

import { useEffect, useState } from 'react';
import { paymentService } from '@/lib/services/paymentService';
import { Payment } from '@/types/inventory.types';

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);

  const fetchPayments = async () => {
    const data = await paymentService.getPayments();
    setPayments(data);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold">Payment History</h2>
      {/* Render payment history table */}
    </div>
  );
}
