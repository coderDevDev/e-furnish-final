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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Package,
  Tag,
  Layers,
  Clipboard,
  MapPin,
  AlertCircle,
  FileText
} from 'lucide-react';

interface UpdateInventoryFormProps {
  onUpdate: (data: Partial<InventoryItem>) => Promise<void>;
  onAdd: (data: Omit<InventoryItem, 'id'>) => Promise<void>;
  inventory: InventoryItem[];
  suppliers: Supplier[];
  mode?: 'add' | 'update';
  initialData?: InventoryItem | null;
  onClose?: () => void;
}

const inventorySchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  quantity: z.preprocess(
    val => Number(val),
    z.number().min(1, 'Quantity must be at least 1')
  ),
  expirationDate: z.date().optional(),
  batchNumber: z.string().min(1, 'Batch number is required'),
  location: z.string().optional(),
  minQuantity: z.preprocess(
    val => Number(val),
    z.number().min(0, 'Minimum quantity must be 0 or more')
  ),
  notes: z.string().optional()
});

const categories = [
  { value: 'medication', label: 'Medication' },
  { value: 'equipment', label: 'Medical Equipment' },
  { value: 'consumables', label: 'Consumables' },
  { value: 'supplies', label: 'Medical Supplies' }
];

export default function UpdateInventoryForm({
  onUpdate,
  onAdd,
  inventory,
  suppliers,
  mode = 'update',
  initialData,
  onClose
}: UpdateInventoryFormProps) {
  const [date, setDate] = useState<Date | null>(
    initialData?.expirationDate ? new Date(initialData.expirationDate) : null
  );

  //console.log({ onAdd });
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(inventorySchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          category: initialData.category,
          supplier: initialData.supplierId.toString(),
          quantity: initialData.quantity,
          batchNumber: initialData.batchNumber,
          location: initialData.location,
          minQuantity: initialData.minQuantity,
          notes: initialData.notes
        }
      : {}
  });

  // Watch values for select fields
  const categoryValue = watch('category');
  const supplierValue = watch('supplier');

  // Handle select changes
  const handleCategoryChange = (value: string) => {
    setValue('category', value, { shouldValidate: true });
  };

  const handleSupplierChange = (value: string) => {
    setValue('supplier', value, { shouldValidate: true });
  };

  const onSubmit = async (data: any) => {
    const formattedData = {
      ...data,
      supplierId: parseInt(data.supplier),
      quantity: parseInt(data.quantity),
      minQuantity: parseInt(data.minQuantity),
      expirationDate: date
    };

    try {
      if (mode === 'add') {
        await onAdd(formattedData);
      } else {
        await onUpdate({
          ...formattedData,
          id: initialData?.id
        });
      }
      // Clear form after successful submission
      reset();
      // Close modal if onClose is provided
      onClose?.();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Card className="overflow-y-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'add' ? 'Add New Item' : 'Update Medical Inventory'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[70vh]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <div className="relative">
                <Package className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter item name"
                  className={`pl-8 ${errors.name ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs">{errors.name.message}</p>
              )}
            </div>

            <div className="flex space-x-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={categoryValue}
                  onValueChange={handleCategoryChange}>
                  <SelectTrigger
                    className={`${errors.category ? 'border-red-500' : ''}`}>
                    <div className="flex items-center">
                      <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select category" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-red-500 text-xs">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={supplierValue}
                  onValueChange={handleSupplierChange}>
                  <SelectTrigger
                    className={`${errors.supplier ? 'border-red-500' : ''}`}>
                    <div className="flex items-center">
                      <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select supplier" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplier && (
                  <p className="text-red-500 text-xs">
                    {errors.supplier.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <div className="relative">
                <Clipboard className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="quantity"
                  type="number"
                  {...register('quantity')}
                  className={`pl-8 ${errors.quantity ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.quantity && (
                <p className="text-red-500 text-xs">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !date ? 'text-muted-foreground' : ''
                    } ${errors.expirationDate ? 'border-red-500' : ''}`}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <div className="relative">
                <Layers className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="batchNumber"
                  {...register('batchNumber')}
                  placeholder="Enter batch number"
                  className={`pl-8 ${
                    errors.batchNumber ? 'border-red-500' : ''
                  }`}
                />
              </div>
              {errors.batchNumber && (
                <p className="text-red-500 text-xs">
                  {errors.batchNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
              <div className="relative">
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Enter storage location"
                  className={`pl-8 ${errors.location ? 'border-red-500' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minQuantity">Minimum Quantity Alert</Label>
              <div className="relative">
                <AlertCircle className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="minQuantity"
                  type="number"
                  {...register('minQuantity')}
                  className={`pl-8 ${
                    errors.minQuantity ? 'border-red-500' : ''
                  }`}
                  placeholder="Set minimum quantity for alerts"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <div className="relative">
                <FileText className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="notes"
                  {...register('notes')}
                  placeholder="Any special instructions or notes"
                  className={`pl-8 ${errors.notes ? 'border-red-500' : ''}`}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white">
              {mode === 'add' ? 'Add Item' : 'Update Inventory'}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
