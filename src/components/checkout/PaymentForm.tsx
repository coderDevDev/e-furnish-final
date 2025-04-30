'use client';

import { useState, useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '@/lib/hooks/redux';
import { InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import PayPalComponent from './PayPalComponent';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import { clearCart } from '@/lib/features/carts/cartsSlice';
import type { CartItem } from '@/lib/features/carts/cartsSlice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { FIRST_DISTRICT_MUNICIPALITIES } from '@/lib/utils/shipping';

const formSchema = z.object({
  paymentMethod: z.enum(['cod', 'paypal']),
  changeNeeded: z.string().optional(),
  deliveryAddress: z.string().optional()
});

type PaymentFormValues = z.infer<typeof formSchema>;

interface PaymentFormProps {
  onNext: () => void;
}

type ShippingSettings = {
  free_shipping_areas: string[];
  standard_shipping_fee: number;
};

export function PaymentForm({ onNext }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const { items } = useAppSelector(state => state.carts);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const supabase = createClientComponentClient();
  const [shippingSettings, setShippingSettings] =
    useState<ShippingSettings | null>(null);
  // const [shippingFee, setShippingFee] = useState<number>(0);
  const deliveryAddress = useAppSelector(
    state => state.checkout.deliveryAddress
  );

  const shippingFee = useAppSelector(state => state.checkout.shippingFee);

  const hasItems = items && items.length > 0;
  const calculateTotals = () => {
    if (!hasItems) return { subtotal: 0, discount: 0, total: 0 };

    const itemTotals = items.reduce(
      (acc, item: CartItem) => {
        const itemPrice = item.product.price * item.quantity;
        const discountAmount =
          (itemPrice * (item.product.discount?.percentage || 0)) / 100;

        return {
          subtotal: acc.subtotal + itemPrice,
          discount: acc.discount + discountAmount,
          total: acc.total + (itemPrice - discountAmount)
        };
      },
      { subtotal: 0, discount: 0, total: 0 }
    );

    return {
      ...itemTotals,
      total: itemTotals.total + shippingFee
    };
  };

  const { total } = calculateTotals();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: 'cod'
    }
  });

  const selectedMethod = form.watch('paymentMethod');

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

  const isAreaEligibleForFreeShipping = (area: string) => {
    return shippingSettings?.free_shipping_areas.some(
      freeArea => freeArea.toLowerCase() === area.toLowerCase()
    );
  };

  const calculateShippingFee = (address: string) => {
    const municipality = extractMunicipalityFromAddress(address);
    if (isAreaEligibleForFreeShipping(municipality)) {
      return 0;
    }
    return shippingSettings?.standard_shipping_fee || 500;
  };

  const extractMunicipalityFromAddress = (address: string) => {
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

    const lowerAddress = address.toLowerCase();

    for (const [keyword, fullName] of Object.entries(municipalityKeywords)) {
      if (lowerAddress.includes(keyword)) {
        return fullName;
      }
    }

    return 'other';
  };

  const updateProductInventory = async orderItems => {
    try {
      for (const item of orderItems) {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('stock, sales_count')
          .eq('id', item.product_id)
          .single();

        if (productError) {
          console.error('Error fetching product data:', productError);
          continue;
        }

        const newStock = Math.max(0, (productData.stock || 0) - item.quantity);
        const newSalesCount =
          (parseInt(productData.sales_count) || 0) + parseInt(item.quantity);

        const { error: updateError } = await supabase
          .from('products')
          .update({
            stock: newStock,
            sales_count: newSalesCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_id);

        if (updateError) {
          console.error('Error updating product inventory:', updateError);
        }
      }
    } catch (error) {
      console.error('Error in updateProductInventory:', error);
    }
  };

  const generateOrderAcknowledgment = (orderData, userProfile) => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Manonson Furniture Shop', 15, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Quality Furniture Specialists', 15, 25);
      doc.text('', 150, 15);
      doc.text('Zone 2, Colacling, Lupi, Camarines Sur', 150, 20);
      doc.text('Tel: +63992771013 ', 150, 25);
      doc.text('e-furnish-final.vercel.app', 150, 30);

      doc.line(15, 32, 195, 32);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDER ACKNOWLEDGEMENT No ' + String(orderData.id), 105, 42, {
        align: 'center'
      });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      doc.text('Customer:', 15, 55);
      doc.text(userProfile.profile.full_name, 15, 60);

      if (userProfile.profile.address) {
        const address = userProfile.profile.address;
        const addressLines = [
          address.street || '',
          address.barangay_name || '',
          address.city_name || '',
          address.province_name || '',
          address.zip_code || ''
        ].filter(Boolean);

        let y = 65;
        addressLines.forEach(line => {
          doc.text(line, 15, y);
          y += 5;
        });

        doc.text(userProfile.profile.email || '', 15, y + 5);
        doc.text(userProfile.profile.phone || '', 15, y + 10);
      }

      doc.text('Your Order No:', 130, 55);
      doc.text(String(orderData.id), 170, 55);

      doc.text('Date:', 130, 60);
      doc.text(format(new Date(), 'MM/dd/yyyy'), 170, 60);

      doc.text('Your Account No:', 130, 65);
      doc.text(String(userProfile.user.id).substring(0, 8), 170, 65);

      doc.text('All Prices in:', 130, 70);
      doc.text('Philippine Peso (₱)', 170, 70);

      doc.text('Page:', 130, 75);
      doc.text('1 of 1', 170, 75);

      doc.setFontSize(8);
      doc.text(
        'Thank you for your purchase order. We have pleasure in confirming price and delivery for the items ordered, as follows:',
        15,
        85
      );

      const tableColumn = [
        'Quantity',
        'Description',
        'Unit Price',
        'VAT',
        'Total',
        'Expected Delivery'
      ];

      const tableRows = [];

      items.forEach(item => {
        const itemPrice = item.product.price;
        const totalPrice = itemPrice * item.quantity;
        const vat = totalPrice * 0.12;

        const deliveryDate = format(
          new Date(new Date().setDate(new Date().getDate() + 7)),
          'MM/dd/yyyy'
        );

        tableRows.push([
          item.quantity.toString(),
          item.product.title +
            (item.product.customization ? ' (Customized)' : ''),
          '₱' +
            itemPrice.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }),
          '₱' +
            vat.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }),
          '₱' +
            totalPrice.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }),
          deliveryDate
        ]);
      });

      tableRows.push([
        '1',
        'Shipping Fee',
        '₱' +
          shippingFee.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }),
        '₱0.00',
        '₱' +
          shippingFee.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }),
        '-'
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 90,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;

      const subtotalString =
        '₱' +
        calculateTotals().subtotal.toLocaleString('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });

      const vatString =
        '₱' +
        (calculateTotals().subtotal * 0.12).toLocaleString('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });

      const totalString =
        '₱' +
        total.toLocaleString('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });

      doc.text('Total Net:', 130, finalY);
      doc.text(subtotalString, 170, finalY);

      doc.text('VAT:', 130, finalY + 5);
      doc.text(vatString, 170, finalY + 5);

      // doc.text('Total Gross:', 130, finalY + 10);
      doc.text(totalString, 170, finalY + 10);

      doc.setFontSize(8);
      doc.text(
        'eFurnish terms and conditions available on request',
        15,
        finalY + 20
      );

      doc.text('Goods to be delivered to:', 15, finalY + 30);
      if (userProfile.profile.address) {
        const address = userProfile.profile.address;
        doc.text(`${userProfile.profile.full_name}`, 15, finalY + 35);
        doc.text(
          `${address.street}, ${address.barangay_name}`,
          15,
          finalY + 40
        );
        doc.text(
          `${address.city_name}, ${address.province_name} ${address.zip_code}`,
          15,
          finalY + 45
        );
      }

      doc.save(`eFurnish_Order_${orderData.id}_Acknowledgment.pdf`);
    } catch (error) {
      console.error('Error generating order acknowledgment:', error);
      toast.error('Failed to generate order acknowledgment document');
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log({ hasItems });
    if (!hasItems) return;

    setIsProcessing(true);
    try {
      const userProfile = await authService.getUserProfile();
      if (!userProfile) throw new Error('User profile not found');

      const orderItems = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        customization: item.product.customization,
        item_total: item.product.price * item.quantity
      }));

      if (!deliveryAddress?.address) {
        throw new Error('Delivery address is required');
      }

      const calculatedShippingFee = calculateShippingFee(
        deliveryAddress.address
      );

      const { data: order, error } = await authService.createOrder({
        user_id: userProfile.user.id,
        items: orderItems,
        total_amount: total,
        shipping_fee: shippingFee,
        delivery_address: deliveryAddress.address,
        delivery_municipality: extractMunicipalityFromAddress(
          deliveryAddress.address
        ),
        payment_method: values.paymentMethod,
        payment_status: 'pending',
        shipping_address: userProfile.profile.address,
        change_needed: values.changeNeeded
          ? parseFloat(values.changeNeeded)
          : undefined
      });

      if (error) throw error;
      if (!order) throw new Error('Failed to create order');

      await updateProductInventory(orderItems);

      console.log({ order });
      generateOrderAcknowledgment(order, userProfile);

      try {
        await authService.sendOrderConfirmationEmail(order.id);
      } catch (emailError) {
        console.error('Error sending order confirmation email:', emailError);
      }

      setPlacedOrderId(order.id);
      setSuccessDialogOpen(true);
      toast.success(
        'Order placed successfully! Check your email for confirmation.'
      );

      dispatch(clearCart());
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-4">
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="cod" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">💰</span>
                          <span>Cash on Delivery (COD)</span>
                          <HoverCard>
                            <HoverCardTrigger>
                              <InfoIcon className="h-4 w-4 text-gray-400" />
                            </HoverCardTrigger>
                            <HoverCardContent>
                              Pay in cash when your order arrives. Please
                              prepare the exact amount of ₱
                              {total.toLocaleString()}
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      </FormLabel>
                    </FormItem>

                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="paypal" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">💳</span>
                          <span>PayPal – Secure Online Payment</span>
                          <HoverCard>
                            <HoverCardTrigger>
                              <InfoIcon className="h-4 w-4 text-gray-400" />
                            </HoverCardTrigger>
                            <HoverCardContent>
                              Pay securely using your PayPal account or credit
                              card.
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedMethod === 'cod' ? (
            <>
              {/* <FormField
                control={form.control}
                name="deliveryAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              <Button
                type="submit"
                className="w-full bg-primary"
                disabled={isProcessing}>
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  'Confirm Order'
                )}
              </Button>
            </>
          ) : (
            <div className="mt-4">
              <PayPalComponent amount={total} onSuccess={onNext} />
            </div>
          )}
        </form>
      </Form>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Order Placed Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Thank you for your order. We'll start processing it right away.
              Please check your email for the order confirmation.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSuccessDialogOpen(false);
                  router.push('/shop');
                }}>
                Continue Shopping
              </Button>
              <Button
                onClick={() => {
                  setSuccessDialogOpen(false);
                  router.push(`/orders/${placedOrderId}`);
                }}>
                View Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
