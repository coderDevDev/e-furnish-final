'use client';

import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import InventoryTable from './InventoryTable';
import OrderTable from './OrderTable';
import SupplierTable from './SupplierTable';
import UpdateInventoryForm from './UpdateInventoryForm';
import AddSupplierOrderForm from './AddSupplierOrderForm';
import AddSupplierForm from './AddSupplierForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Package, ShoppingCart, Users } from 'lucide-react';
import { inventoryService } from '@/lib/services/inventoryService';
import { orderService } from '@/lib/services/orderService';
import { supplierService } from '@/lib/services/supplierService';
import { productService } from '@/lib/services/productService';
import { cn } from '@/lib/utils';
import { notify } from '@/components/ui/notifications';
import { toast } from 'sonner';
import type {
  InventoryItem,
  Supplier,
  PurchaseOrder,
  SupplierOffer
} from '@/types/inventory.types';
import type { Product } from '@/types/product.types';
import SupplierOfferTable from './SupplierOfferTable';
import { supplierOfferService } from '@/lib/services/supplierOfferService';

const initialInventory: InventoryItem[] = [
  { id: 1, name: 'Widget A', quantity: 100, supplierId: 1 },
  { id: 2, name: 'Gadget B', quantity: 50, supplierId: 2 }
];

const initialOrders: PurchaseOrder[] = [
  {
    id: '1',
    supplierId: '1',
    itemId: '1',
    quantity: 10,
    date: '2023-05-01',
    status: 'Pending'
  },
  {
    id: '2',
    supplierId: '2',
    itemId: '2',
    quantity: 5,
    date: '2023-05-02',
    status: 'Shipped'
  }
];

const initialSuppliers: Supplier[] = [
  { id: '1', name: 'Acme Corp', contact: 'john@acme.com' },
  { id: '2', name: 'Tech Supplies Inc', contact: 'jane@techsupplies.com' }
];

interface InventoryManagementProps {
  products: Product[];
  fetchProducts: () => Promise<void>;
}

export default function InventoryManagement({
  products,
  fetchProducts
}: InventoryManagementProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [notifiedItems, setNotifiedItems] = useState<Set<string>>(new Set());
  const [offers, setOffers] = useState<SupplierOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // const [products, setProducts] = useState<Product[]>(products);
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, ordersData, suppliersData] = await Promise.all([
          productService.getAllProducts(),
          orderService.getAllOrders(),
          supplierService.getAllSuppliers()
        ]);
        //setProducts(productsData);
        setOrders(ordersData);
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
      }
    };
    fetchData();
  }, []);

  const updateInventory = async (data: Partial<InventoryItem>) => {
    try {
      if (data.id) {
        const updatedItem = await inventoryService.updateInventoryItem(
          data.id,
          data
        );
        setInventory(prev =>
          prev.map(item =>
            item.id === updatedItem.id ? { ...item, ...updatedItem } : item
          )
        );
        setIsInventoryModalOpen(false);
        notify.stockUpdate(updatedItem.name, updatedItem.quantity);
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Failed to update inventory');
    }
  };

  const addInventory = async (
    data: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const newItem = await inventoryService.createInventoryItem(data);
      setInventory(prev => [...prev, newItem]);
      setIsInventoryModalOpen(false);
      toast.success('Inventory item added successfully');
    } catch (error) {
      console.error('Error adding inventory:', error);
      toast.error('Failed to add inventory item');
    }
  };

  const addOrder = async (
    orderData: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const newOrder = await orderService.createOrder(orderData);
      setOrders(prev => [...prev, newOrder]);
      setIsOrderModalOpen(false);
      toast.success('Order added successfully');
    } catch (error) {
      console.error('Error adding order:', error);
      toast.error('Failed to add order');
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: PurchaseOrder['status']
  ) => {
    try {
      const updatedOrder = await orderService.updateOrderStatus(
        orderId,
        newStatus
      );
      setOrders(prev =>
        prev.map(order => (order.id === orderId ? updatedOrder : order))
      );
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await orderService.deleteOrder(orderId);
      setOrders(prev => prev.filter(order => order.id !== orderId));
      toast.success('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await supplierService.getAllSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const addSupplier = async (
    data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      await supplierService.createSupplier(data);
      fetchSuppliers();
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
    }
  };

  const updateSupplier = async (data: Supplier) => {
    try {
      await supplierService.updateSupplier(data.id, data);
      fetchSuppliers();
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await supplierService.deleteSupplier(id);
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  };

  const handlePlaceOrder = (itemId: string) => {
    setIsOrderModalOpen(true);
    setSelectedItemId(itemId);
  };

  const checkStockLevels = useCallback(
    items => {
      console.log({ items });
      items.forEach(item => {
        item.minQuantity = 20;
        item.name = item.title;
        if (!notifiedItems.has(item.id)) {
          if (item.stock !== undefined && item.minQuantity !== undefined) {
            if (item.stock <= item.minQuantity * 0.5) {
              notify.criticalStock(item.name, item.stock);
              setNotifiedItems(prev => new Set([...prev, item.id]));
            } else if (item.stock <= item.minQuantity) {
              notify.lowStock(item.name, item.stock, item.stock);
              setNotifiedItems(prev => new Set([...prev, item.id]));
            }
          }
        }
      });
    },
    [notifiedItems]
  );

  useEffect(() => {
    console.log({ products });
    checkStockLevels(products);
  }, [products, checkStockLevels]);

  const handleUpdateProduct = async (id: string, data: Partial<Product>) => {
    try {
      await productService.updateProduct(id, data);
      const updatedProducts = await productService.getAllProducts();
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      const updatedProducts = await productService.getAllProducts();

      fetchProducts();
      // setProducts(updatedProducts);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const handleAddProduct = async (
    data: Omit<Product, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      await productService.createProduct(data);
      const updatedProducts = await productService.getAllProducts();
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const data = await supplierOfferService.getOffers();
      setOffers(data);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchOffers();
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="w-full border-b flex h-auto p-0 bg-transparent gap-6  justify-start">
          <TabsTrigger
            value="inventory"
            className={cn(
              'flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary',
              'bg-transparent hover:bg-slate-50/50 rounded-none data-[state=active]:bg-transparent',
              'data-[state=active]:text-primary data-[state=active]:shadow-none'
            )}>
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className={cn(
              'flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary',
              'bg-transparent hover:bg-slate-50/50 rounded-none data-[state=active]:bg-transparent',
              'data-[state=active]:text-primary data-[state=active]:shadow-none'
            )}>
            <ShoppingCart className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger
            value="suppliers"
            className={cn(
              'flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary',
              'bg-transparent hover:bg-slate-50/50 rounded-none data-[state=active]:bg-transparent',
              'data-[state=active]:text-primary data-[state=active]:shadow-none'
            )}>
            <Users className="h-4 w-4" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger
            value="supplier-offers"
            className={cn(
              'flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary',
              'bg-transparent hover:bg-slate-50/50 rounded-none data-[state=active]:bg-transparent',
              'data-[state=active]:text-primary data-[state=active]:shadow-none'
            )}>
            <Users className="h-4 w-4" />
            Supplier Offers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                Manage your inventory items and stock levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTable
                fetchProducts={fetchProducts}
                products={products}
                suppliers={suppliers}
                onUpdate={handleUpdateProduct}
                onDelete={handleDeleteProduct}
                onAdd={handleAddProduct}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>
                Track and manage purchase orders from suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderTable
                orders={orders}
                products={products}
                suppliers={suppliers}
                onUpdateStatus={updateOrderStatus}
                onAddOrder={addOrder}
                onDeleteOrder={deleteOrder}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Suppliers</CardTitle>
              <CardDescription>
                Manage your supplier information and contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupplierTable
                suppliers={suppliers}
                onAdd={addSupplier}
                onUpdate={updateSupplier}
                onDelete={deleteSupplier}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supplier-offers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Offers</CardTitle>
              <CardDescription>Manage your supplier offers</CardDescription>
            </CardHeader>
            <CardContent>
              <SupplierOfferTable
                offers={offers}
                suppliers={suppliers}
                onRefresh={fetchOffers}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Update Inventory Modal */}
      <Dialog
        open={isInventoryModalOpen}
        onOpenChange={setIsInventoryModalOpen}>
        <DialogContent>
          <UpdateInventoryForm
            onUpdate={updateInventory}
            onAdd={addInventory}
            inventory={inventory}
            suppliers={suppliers}
            onClose={() => setIsInventoryModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Place Order Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent>
          <AddSupplierOrderForm
            onAdd={(order, updateImmediately) => {
              addOrder(order);
              setIsOrderModalOpen(false);
            }}
            inventory={inventory}
            suppliers={suppliers}
          />
        </DialogContent>
      </Dialog>

      {/* <Tabs defaultValue="offers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="offers">Supplier Offers</TabsTrigger>
        </TabsList>
        <TabsContent value="offers">
          <SupplierOfferTable offers={offers} onRefresh={fetchOffers} />
        </TabsContent>
      </Tabs> */}
    </div>
  );
}
