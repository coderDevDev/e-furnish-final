'use client';

import { useState, useEffect } from 'react';
import type { PurchaseOrder, Supplier } from '@/types/inventory.types';
import type { Product } from '@/types/product.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AddSupplierOrderForm from './AddSupplierOrderForm';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipTrigger
// } from '@/components/ui/tooltip';

interface OrderTableProps {
  orders: PurchaseOrder[];
  products: Product[];
  suppliers: Supplier[];
  onUpdateStatus: (
    orderId: string,
    status: PurchaseOrder['status']
  ) => Promise<void>;
  onAddOrder: (
    order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
}

export default function OrderTable({
  orders,
  products,
  suppliers,
  onUpdateStatus,
  onAddOrder,
  onDeleteOrder
}: OrderTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isLoading, setIsLoading] = useState(false);
  const [localOrders, setLocalOrders] = useState(orders);

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  // Filter orders based on search term
  const filteredOrders = localOrders.filter(order => {
    const supplier = suppliers.find(s => s.id === order.supplier_id)?.name;
    const product = products.find(p => p.id === order.product_id)?.title;
    const searchString = `${supplier} ${product} ${order.status}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'Shipped':
        return <Badge className="bg-blue-100 text-blue-800">Shipped</Badge>;
      case 'Delivered':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleStatusUpdate = async (
    orderId: string,
    status: PurchaseOrder['status']
  ) => {
    try {
      setIsLoading(true);
      await onUpdateStatus(orderId, status);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    try {
      setIsLoading(true);
      await onDeleteOrder(orderId);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusOptions = (currentStatus: string) => {
    if (currentStatus === 'Delivered') {
      return [{ value: 'Delivered', label: 'Delivered' }];
    }
    return [
      { value: 'Pending', label: 'Pending' },
      { value: 'Shipped', label: 'Shipped' },
      { value: 'Delivered', label: 'Delivered' }
    ];
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8 transition-all duration-200"
          />
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Order
        </Button>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Order ID</TableHead>
                <TableHead className="font-semibold">Supplier</TableHead>
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">Quantity</TableHead>
                <TableHead className="font-semibold">Order Date</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    {suppliers.find(s => s.id === order.supplier_id)?.name}
                  </TableCell>
                  <TableCell>
                    {products.find(p => p.id === order.product_id)?.title}
                  </TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>
                    {format(new Date(order.order_date), 'PPP')}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select
                        value={order.status}
                        onValueChange={value =>
                          handleStatusUpdate(
                            order.id,
                            value as PurchaseOrder['status']
                          )
                        }
                        disabled={order.status === 'Delivered'}>
                        <SelectTrigger className="w-32">
                          <SelectValue>{order.status}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {getStatusOptions(order.status).map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(order.id)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{' '}
          {filteredOrders.length} entries
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="flex gap-1">
            {getPageNumbers().map(page => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="w-8 bg-primary hover:bg-primary/90 text-white"
                onClick={() => setCurrentPage(page)}>
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl p-0">
          <AddSupplierOrderForm
            onAdd={onAddOrder}
            products={products}
            suppliers={suppliers}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
