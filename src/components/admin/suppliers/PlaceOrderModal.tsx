'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// Updated props to match what's being passed from SupplierOffersPanel
type PlaceOrderModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer;
  supplierId: string;
  supplierName: string;
  onSuccess?: () => void;
};

// First, add the Offer type at the top
type Offer = {
  id: string;
  title: string;
  description: string;
  price: number;
  discount_percentage: number | null;
  min_order_quantity: number;
  stock_quantity: number;
  supplier_id: string;
};

type OrderFormValues = z.infer<typeof orderFormSchema>;

// Add type for shipping settings
type ShippingSettings = {
  free_shipping_areas: string[];
  standard_shipping_fee: number;
};

export default function PlaceOrderModal({
  open,
  onOpenChange,
  offer,
  supplierId,
  supplierName,
  onSuccess
}: PlaceOrderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClientComponentClient();

  // Add states for shipping
  const [shippingSettings, setShippingSettings] =
    useState<ShippingSettings | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [selectedArea, setSelectedArea] = useState<string>('');

  // Load shipping settings on mount
  useEffect(() => {
    loadShippingSettings();
  }, []);

  const loadShippingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_settings')
        .select('*')
        .single();

      if (error) throw error;
      setShippingSettings(data);
    } catch (error) {
      console.error('Error loading shipping settings:', error);
      toast.error('Failed to load shipping settings');
    }
  };

  // Define form schema inside component where offer is available
  const orderFormSchema = z.object({
    quantity: z.coerce
      .number()
      .min(1, 'Quantity must be at least 1')
      .positive('Quantity must be positive')
      .refine(val => {
        if (!offer?.stock_quantity) return false;
        return val <= offer.stock_quantity;
      }, 'Quantity cannot exceed available stock'),
    delivery_address: z.string().min(5, 'Delivery address is required'),
    delivery_date: z.date({
      required_error: 'Please select a delivery date'
    }),
    payment_terms: z.string().min(1, 'Payment terms are required'),
    notes: z.string().optional()
  });

  // Add safe early return if offer is undefined
  if (!offer && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              Unable to load offer details. Please try again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      quantity: offer?.min_order_quantity || 1,
      delivery_address: '',
      delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      payment_terms: 'COD',
      notes: ''
    }
  });

  // Calculate total price including shipping
  const quantity = form.watch('quantity');
  const unitPrice = offer?.price || 0;
  const discountPercentage = offer?.discount_percentage || 0;
  const discountedPrice = unitPrice - (unitPrice * discountPercentage) / 100;
  const subtotal = quantity * discountedPrice;
  const totalPrice = subtotal + shippingFee;

  // Function to check if area is eligible for free shipping
  const isAreaEligibleForFreeShipping = (area: string) => {
    return shippingSettings?.free_shipping_areas.some(
      freeArea => freeArea.toLowerCase() === area.toLowerCase()
    );
  };

  // Update shipping fee when area changes
  const updateShippingFee = (area: string) => {
    if (isAreaEligibleForFreeShipping(area)) {
      setShippingFee(0);
    } else {
      setShippingFee(shippingSettings?.standard_shipping_fee || 500);
    }
    setSelectedArea(area);
  };

  // Add this function to extract municipality from address
  const extractMunicipalityFromAddress = (address: string) => {
    // List of municipalities to check (including variations)
    const municipalityKeywords = {
      'naga city': 'Naga City',
      naga: 'Naga City',
      bombon: 'Bombon',
      calabanga: 'Calabanga',
      camaligan: 'Camaligan',
      canaman: 'Canaman',
      gainza: 'Gainza',
      magarao: 'Magarao',
      milaor: 'Milaor',
      minalabac: 'Minalabac',
      pamplona: 'Pamplona',
      pasacao: 'Pasacao',
      'san fernando': 'San Fernando'
    };

    // Convert address to lowercase for comparison
    const lowerAddress = address.toLowerCase();

    // Find matching municipality
    for (const [keyword, fullName] of Object.entries(municipalityKeywords)) {
      if (lowerAddress.includes(keyword)) {
        return fullName;
      }
    }

    return 'other';
  };

  // Update the onSubmit function with a simpler approach
  const onSubmit = async (data: OrderFormValues) => {
    try {
      setIsSubmitting(true);

      // Get current user
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to place orders');

      // Get admin profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', user.id)
        .single();

      if (!profileData) throw new Error('User profile not found');

      // 1. Create the order first
      const { data: orderData, error: orderError } = await supabase
        .from('supplier_orders')
        .insert({
          admin_id: profileData.id,
          supplier_id: supplierId,
          order_items: [
            {
              offer_id: offer.id,
              name: offer.title,
              quantity: data.quantity,
              price: discountedPrice
            }
          ],
          total_amount: totalPrice,
          status: 'pending',
          delivery_address: data.delivery_address,
          delivery_municipality: selectedArea,
          shipping_fee: shippingFee,
          delivery_date: data.delivery_date.toISOString(),
          payment_terms: data.payment_terms,
          notes: data.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Update the stock quantity
      const newStockQuantity = offer.stock_quantity - data.quantity;
      const { error: updateError } = await supabase
        .from('supplier_offers')
        .update({
          stock_quantity: newStockQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', offer.id);

      if (updateError) throw updateError;

      toast.success('Order placed successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(`Failed to place order: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          {/* Use supplierName directly instead of supplier.business_name */}
          <DialogTitle>Place Order with {supplierName}</DialogTitle>
          <DialogDescription>
            Fill out the order details below to place an order with this
            supplier.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Product Details</h3>
                  <p className="text-sm text-muted-foreground">
                    Review the product details before placing your order
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Product:</span>
                    <span className="text-sm">
                      {offer?.title || 'Unknown product'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Price per Unit:</span>
                    <span className="text-sm">
                      ₱
                      {discountedPrice.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      Min. Order Quantity:
                    </span>
                    <span className="text-sm">
                      {offer?.min_order_quantity || 1}
                    </span>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          min={offer?.min_order_quantity || 1}
                          max={offer?.stock_quantity}
                          onChange={e => {
                            const value = parseInt(e.target.value);
                            if (value > offer?.stock_quantity) {
                              toast.error(
                                `Maximum available stock is ${offer?.stock_quantity}`
                              );
                              return;
                            }
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum order: {offer?.min_order_quantity || 1} units
                        <br />
                        Available stock: {offer?.stock_quantity} units
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between p-4 bg-muted rounded-md">
                  <span className="font-medium">Total:</span>
                  <span className="font-medium">
                    ₱
                    {totalPrice.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>

              {/* Delivery details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Delivery Details</h3>
                  <p className="text-sm text-muted-foreground">
                    Provide delivery information for your order
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="delivery_address"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel>Delivery Area</FormLabel>
                      <Select
                        value={selectedArea}
                        onValueChange={value => {
                          updateShippingFee(value);
                          setSelectedArea(value);
                        }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select delivery area" />
                        </SelectTrigger>
                        <SelectContent>
                          {shippingSettings?.free_shipping_areas.map(area => (
                            <SelectItem key={area} value={area}>
                              {area} (Free Shipping)
                            </SelectItem>
                          ))}
                          <SelectItem value="other">
                            Other Areas (₱
                            {shippingSettings?.standard_shipping_fee || 500})
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <FormLabel>Complete Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your complete delivery address"
                          {...field}
                          onChange={e => {
                            field.onChange(e);
                            // Only auto-detect if no area is manually selected
                            if (!selectedArea) {
                              const municipality =
                                extractMunicipalityFromAddress(e.target.value);
                              updateShippingFee(municipality);
                              setSelectedArea(municipality);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Select your area above or include your municipality in
                        the address for automatic detection
                      </FormDescription>
                      <FormMessage />

                      {/* Show detected area and shipping fee */}
                      <div className="text-sm space-y-1">
                        <p className="text-muted-foreground">
                          Selected Area:{' '}
                          <span className="font-medium">{selectedArea}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Shipping Fee:{' '}
                          <span className="font-medium">
                            {shippingFee === 0
                              ? 'Free Shipping'
                              : `₱${shippingFee.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}`}
                          </span>
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Preferred Delivery Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}>
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={date =>
                              date < new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select your preferred delivery date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="COD"
                          {...field}
                          defaultValue="COD"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special instructions or notes for the supplier"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2 p-4 bg-muted rounded-md">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal:</span>
                <span className="text-sm">
                  ₱
                  {subtotal.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Shipping Fee:</span>
                <span className="text-sm">
                  {shippingFee === 0
                    ? 'Free Shipping'
                    : `₱${shippingFee.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}`}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>
                  ₱
                  {totalPrice.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
