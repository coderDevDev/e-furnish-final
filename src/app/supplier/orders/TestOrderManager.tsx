'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ownerOrderService } from '@/lib/services/ownerOrderService';
import { supplierOfferService } from '@/lib/services/supplierOfferService';
import { supplierService } from '@/lib/services/supplierService';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Supplier, SupplierOffer } from '@/types/inventory.types';

const testOrderSchema = z.object({
  supplier_offer_id: z.string().min(1, 'Supplier offer ID is required'),
  furniture_type: z.string().min(1, 'Furniture type is required'),
  dimensions: z.object({
    width: z.number().min(1, 'Width must be greater than 0'),
    height: z.number().min(1, 'Height must be greater than 0'),
    depth: z.number().min(1, 'Depth must be greater than 0')
  }),
  color: z.string().min(1, 'Color is required'),
  style: z.string().min(1, 'Style is required'),
  additional_details: z.string().optional(),
  quantity_needed: z.number().min(1, 'Quantity must be greater than 0'),
  delivery_address: z.string().min(1, 'Delivery address is required'),
  target_completion_date: z
    .string()
    .min(1, 'Target completion date is required'),
  owner_details: z.object({
    full_name: z.string().min(1, 'Owner name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required')
  })
});

type TestOrderFormData = z.infer<typeof testOrderSchema>;

interface TestOrderManagerProps {
  supplierId: string;
  onOrderCreated: () => void;
}

export default function TestOrderManager({
  supplierId,
  onOrderCreated
}: TestOrderManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierOffers, setSupplierOffers] = useState<SupplierOffer[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  const form = useForm<TestOrderFormData>({
    resolver: zodResolver(testOrderSchema),
    defaultValues: {
      dimensions: {
        width: 0,
        height: 0,
        depth: 0
      },
      quantity_needed: 1
    }
  });

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await supplierService.getAllSuppliers();
        setSuppliers(data);
      } catch (error) {
        toast.error('Failed to fetch suppliers');
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch supplier offers when supplier is selected
  useEffect(() => {
    const fetchSupplierOffers = async () => {
      if (!selectedSupplierId) {
        setSupplierOffers([]);
        return;
      }
      try {
        const data = await supplierOfferService.getSupplierOffers(
          selectedSupplierId
        );
        setSupplierOffers(data);
      } catch (error) {
        toast.error('Failed to fetch supplier offers');
      }
    };
    fetchSupplierOffers();
  }, [selectedSupplierId]);

  // Update the form when a supplier offer is selected
  const handleSupplierOfferChange = (offerId: string) => {
    const selectedOffer = supplierOffers.find(offer => offer.id === offerId);
    if (selectedOffer) {
      form.setValue('supplier_offer_id', offerId);
      // You could pre-fill other form fields based on the offer if needed
    }
  };

  const handleCreateTestOrder = async (data: TestOrderFormData) => {
    try {
      const orderData = {
        supplier_id: selectedSupplierId,
        supplier_offer_id: data.supplier_offer_id,
        owner_id: '55a5b517-e3f2-4460-8d17-9083923d3b43', // This would normally come from auth
        furniture_type: data.furniture_type,
        furniture_details: {
          dimensions: data.dimensions,
          color: data.color,
          style: data.style,
          additional_details: data.additional_details
        },
        quantity_needed: data.quantity_needed,
        delivery_address: data.delivery_address,
        target_completion_date: data.target_completion_date,
        owner_details: data.owner_details
      };

      console.log({ orderData });

      await ownerOrderService.createTestOrder(orderData);
      toast.success('Test order created successfully');
      setIsOpen(false);
      onOrderCreated();
      form.reset();
    } catch (error) {
      console.error('Error creating test order:', error);
      toast.error('Failed to create test order');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Create Test Order</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Test Order</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleCreateTestOrder)}
            className="space-y-6">
            {/* Supplier Selection */}
            <div className="space-y-4">
              <FormItem>
                <FormLabel>Select Supplier</FormLabel>
                <Select
                  onValueChange={value => setSelectedSupplierId(value)}
                  value={selectedSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>

              <FormField
                control={form.control}
                name="supplier_offer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Offer</FormLabel>
                    <Select
                      onValueChange={value => {
                        field.onChange(value);
                        handleSupplierOfferChange(value);
                      }}
                      value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a material offer" />
                      </SelectTrigger>
                      <SelectContent>
                        {supplierOffers.map(offer => (
                          <SelectItem key={offer.id} value={offer.id}>
                            {offer.material_name} - {offer.price_per_unit} per{' '}
                            {offer.unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Basic Order Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="furniture_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Furniture Type</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Chair, Table, etc."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="dimensions.width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dimensions.height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dimensions.depth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depth (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Style and Color */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Walnut, White" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Style</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Modern, Classic" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Details */}
            <FormField
              control={form.control}
              name="additional_details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter any additional specifications or requirements"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Order Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity_needed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="target_completion_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Completion Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Owner Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Owner Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="owner_details.full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="owner_details.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="owner_details.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="delivery_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Create Order
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
