'use client';

import { useEffect, useState } from 'react';
import { ownerOrderService } from '@/lib/services/ownerOrderService';
import { OwnerOrder } from '@/types/inventory.types';
import { toast } from 'sonner';
import OrderList from './OrderList';
import OrderDetails from './OrderDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TestOrderManager from './TestOrderManager';

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OwnerOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [supplier, setSupplier] = useState<OwnerOrder | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await ownerOrderService.getSupplierOrders();
      setOrders(data);
      setSupplier(data.find(o => o.status === 'Pending') || null);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    return order.status.toLowerCase() === activeTab;
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Owner Orders</h1>
        <TestOrderManager
          supplierId={supplier?.id}
          onOrderCreated={fetchOrders}
        />
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OrderList
              orders={filteredOrders}
              isLoading={isLoading}
              onSelectOrder={setSelectedOrder}
            />
            {selectedOrder && (
              <OrderDetails
                order={selectedOrder}
                onStatusUpdate={async (orderId, status) => {
                  try {
                    await ownerOrderService.updateOrderStatus(orderId, status);
                    toast.success('Order status updated');
                    fetchOrders();
                  } catch (error) {
                    toast.error('Failed to update order status');
                  }
                }}
                onClose={() => setSelectedOrder(null)}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
