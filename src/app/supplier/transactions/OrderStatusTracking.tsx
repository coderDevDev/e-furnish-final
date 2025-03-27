'use client';

import { useEffect, useState } from 'react';
import { OrderTable } from '../offers/OrderTable';
import { transactionService } from '@/lib/services/transactionService';
import { PurchaseOrder } from '@/types/inventory.types';

export default function OrderStatusTracking() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  const fetchOrders = async () => {
    const data = await transactionService.getOrders();
    setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold">Order Status Tracking</h2>
      <OrderTable orders={orders} />
    </div>
  );
}
