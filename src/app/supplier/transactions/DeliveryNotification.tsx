'use client';

import { useEffect, useState } from 'react';
import { deliveryService } from '@/lib/services/deliveryService';
import { Delivery } from '@/types/inventory.types';

export default function DeliveryNotification() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  const fetchDeliveries = async () => {
    const data = await deliveryService.getDeliveries();
    setDeliveries(data);
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold">Delivery Notifications</h2>
      {/* Render delivery notifications */}
    </div>
  );
}
