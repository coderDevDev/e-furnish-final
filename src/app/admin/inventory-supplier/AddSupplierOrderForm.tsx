'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Package,
  Building2,
  Hash,
  FileText,
  X,
  Loader2
} from 'lucide-react';
import type { PurchaseOrder, Supplier } from '@/types/inventory.types';
import type { Product } from '@/types/product.types';

const orderSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.preprocess(
    val => Number(val),
    z.number().min(1, 'Quantity must be at least 1')
  ),
  notes: z.string().optional(),
  order_date: z.date().optional()
});

interface AddSupplierOrderFormProps {
  onAdd: (
    order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  products: Product[];
  suppliers: Supplier[];
  onClose?: () => void;
}

export default function AddSupplierOrderForm({
  onAdd,
  products,
  suppliers,
  onClose
}: AddSupplierOrderFormProps) {
  const [date, setDate] = useState<Date | null>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      supplier_id: '',
      product_id: '',
      quantity: '',
      notes: ''
    }
  });

  // Watch the values
  const supplierValue = watch('supplier_id') || '';
  const productValue = watch('product_id') || '';

  // Update handlers
  const handleSupplierChange = (value: string) => {
    //console.log('Supplier selected:', value);
    setValue('supplier_id', value);
  };

  const handleProductChange = (value: string) => {
    //console.log('Product selected:', value);
    setValue('product_id', value);
  };

  const handleClose = () => {
    reset();
    setDate(new Date());
    onClose?.();
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await onAdd({
        ...data,
        supplier_id: data.supplier_id,
        product_id: data.product_id,
        quantity: parseInt(data.quantity),
        order_date: date?.toISOString() || new Date().toISOString(),
        status: 'Pending'
      });
      handleClose();
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  //console.log({ errors });
  return (
    <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-lg">
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Create New Order
        </h2>
        {/* <button
          onClick={handleClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button> */}
      </div>

      {/* Modal Body - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Supplier Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">
              Supplier
            </Label>
            <Select value={supplierValue} onValueChange={handleSupplierChange}>
              <SelectTrigger
                className={`w-full border ${
                  errors.supplier_id ? 'border-red-500' : 'border-slate-200'
                } rounded-xl bg-white px-3 py-2 text-sm`}>
                <div className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Select supplier">
                    {suppliers.find(s => String(s.id) === supplierValue)
                      ?.name || 'Select supplier'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={String(supplier.id)}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplier_id && (
              <p className="text-xs text-red-500">
                {errors.supplier_id.message}
              </p>
            )}
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">
              Product
            </Label>
            <Select value={productValue} onValueChange={handleProductChange}>
              <SelectTrigger
                className={`w-full border ${
                  errors.product_id ? 'border-red-500' : 'border-slate-200'
                } rounded-xl bg-white px-3 py-2 text-sm`}>
                <div className="flex items-center">
                  <Package className="mr-2 h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Select product">
                    {products.find(p => String(p.id) === productValue)?.title ||
                      'Select product'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={String(product.id)}>
                    {product.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.product_id && (
              <p className="text-xs text-red-500">
                {errors.product_id.message}
              </p>
            )}
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">
              Quantity
            </Label>
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="number"
                {...register('quantity')}
                className={`w-full border ${
                  errors.quantity ? 'border-red-500' : 'border-slate-200'
                } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
                placeholder="Enter quantity"
              />
            </div>
            {errors.quantity && (
              <p className="text-xs text-red-500">{errors.quantity.message}</p>
            )}
          </div>

          {/* Order Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">
              Order Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start border ${
                    errors.order_date ? 'border-red-500' : 'border-slate-200'
                  } rounded-xl bg-white px-3 py-2 text-sm font-normal`}>
                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={date => {
                    setDate(date);
                    setValue('order_date', date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.order_date && (
              <p className="text-xs text-red-500">
                {errors.order_date.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">Notes</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                {...register('notes')}
                className={`w-full border ${
                  errors.notes ? 'border-red-500' : 'border-slate-200'
                } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
                placeholder="Any special instructions or notes"
              />
            </div>
            {errors.notes && (
              <p className="text-xs text-red-500">{errors.notes.message}</p>
            )}
          </div>

          {/* Modal Footer - Fixed */}
          <div className="sticky bottom-0 z-10 rounded-b-xl bg-white px-6 py-4 border-t border-slate-200">
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50"
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="relative rounded-xl bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:bg-primary/50">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Order</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
