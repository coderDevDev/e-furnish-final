'use client';

import { Button } from '@/components/ui/button';
import { Product } from '@/types/product.types';
import { ProductCustomization } from './CustomizationOptions';
import { useAppDispatch, useAppSelector } from '@/lib/hooks/redux';
import {
  addToCart,
  clearCart,
  CartItem
} from '@/lib/features/carts/cartsSlice';
import { toast } from 'sonner';
import { ShoppingCart, Pencil, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { CustomizationOptions } from './CustomizationOptions';
// Import pricing data
const materials = [
  { id: 'leather', name: 'Premium Leather', priceMultiplier: 1.5 },
  { id: 'fabric', name: 'Premium Fabric', priceMultiplier: 1.2 },
  { id: 'velvet', name: 'Velvet', priceMultiplier: 1.3 },
  { id: 'wood', name: 'Solid Wood', priceMultiplier: 1.4 }
];

const components = {
  legs: [
    { id: 'wooden', name: 'Wooden Legs', price: 2500 },
    { id: 'metal', name: 'Metal Legs', price: 3750 },
    { id: 'chrome', name: 'Chrome Legs', price: 5000 }
  ],
  cushions: [
    { id: 'standard', name: 'Standard Fill', price: 0 },
    { id: 'memory-foam', name: 'Memory Foam', price: 7500 },
    { id: 'down', name: 'Down Fill', price: 10000 }
  ],
  handles: [
    { id: 'none', name: 'No Handles', price: 0 },
    { id: 'metal', name: 'Metal Handles', price: 1250 },
    { id: 'leather', name: 'Leather Pulls', price: 1750 }
  ]
};

const addons = [
  { id: 'pillows', name: 'Decorative Pillows', price: 2250 },
  { id: 'cover', name: 'Protective Cover', price: 3750 },
  { id: 'ottoman', name: 'Matching Ottoman', price: 9950 }
];

interface AddToCardSectionProps {
  data: Product;
  customization: ProductCustomization | null;
  handleCustomizationChange: (customization: ProductCustomization) => void;
}

const AddToCardSection = ({
  data,
  customization,
  handleCustomizationChange
}: AddToCardSectionProps) => {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector(state => state.carts);
  const [showCustomization, setShowCustomization] = useState(false);
  const [tempCustomization, setTempCustomization] =
    useState<ProductCustomization | null>(null);

  const calculateCustomizationCost = (customization: ProductCustomization) => {
    // Calculate components cost
    const componentsCost = Object.values(customization.components || {}).reduce(
      (total, componentId) => {
        const component = Object.values(components)
          .flat()
          .find(c => c.id === componentId);
        return total + (component?.price || 0);
      },
      0
    );

    // Calculate addons cost
    const addonsCost = customization.addons.reduce((total, addon) => {
      const unitType = UNIT_TYPES.find(u => u.value === addon.unit);
      if (!unitType) return total + addon.price;

      const basePrice = addon.price / unitType.priceMultiplier;
      const totalAddonPrice = Math.round(basePrice * unitType.priceMultiplier);
      return total + totalAddonPrice;
    }, 0);

    // Apply material multiplier
    const materialMultiplier =
      materials.find(m => m.id === customization.material)?.priceMultiplier ||
      1;

    // Add color cost if exists
    const colorCost = customization.color?.price || 0;

    const basePrice = data.price;
    const totalPrice =
      (basePrice + componentsCost + addonsCost + colorCost) *
      materialMultiplier;

    return {
      basePrice,
      totalPrice,
      customizationCost: totalPrice - basePrice
    };
  };

  const handleDirectAddToCart = () => {
    const cartItem: CartItem = {
      product: {
        ...data,
        price: data.price,
        customization: undefined
      },
      quantity: 1
    };

    dispatch(addToCart(cartItem));
    toast.success('Added to cart successfully!');
  };

  const handleCustomizedAddToCart = () => {
    if (!tempCustomization) {
      toast.error('Please select customization options');
      return;
    }

    const { totalPrice, customizationCost } =
      calculateCustomizationCost(tempCustomization);

    const cartItem: CartItem = {
      product: {
        ...data,
        price: totalPrice,
        customization: {
          ...tempCustomization,
          totalCustomizationCost: customizationCost
        }
      },
      quantity: 1
    };

    dispatch(addToCart(cartItem));
    handleCustomizationChange(tempCustomization);
    setShowCustomization(false);
    toast.success('Customized product added to cart!');
  };

  const handleMadeToOrder = () => {
    if (!tempCustomization) {
      toast.error('Please customize your order first');
      return;
    }

    const { totalPrice, customizationCost } =
      calculateCustomizationCost(tempCustomization);
    const downpaymentAmount = Math.round(totalPrice * 0.3); // 30% downpayment

    const cartItem: CartItem = {
      product: {
        ...data,
        price: totalPrice,
        customization: {
          ...tempCustomization,
          totalCustomizationCost: customizationCost,
          isDownpayment: true,
          downpaymentAmount
        }
      },
      quantity: 1
    };

    dispatch(addToCart(cartItem));
    setShowCustomization(false);
    toast.success('Made-to-order item added to cart!');
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    if (items.length > 0) {
      console.warn('Cart not cleared properly');
      dispatch(clearCart());
    }
    toast.success('Cart cleared successfully!');
  };

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <Button
          onClick={handleClearCart}
          variant="outline"
          className="w-full border-red-500 text-red-500 hover:bg-red-50">
          Clear Cart ({items.length} items)
        </Button>
      )}

      <Button
        onClick={handleDirectAddToCart}
        className="w-full bg-primary hover:bg-primary/90">
        <ShoppingCart className="w-4 h-4 mr-2" />
        Add to Cart
      </Button>

      <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary/10">
            <Pencil className="w-4 h-4 mr-2" />
            Customize
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Customize Your Order</DialogTitle>
            <DialogDescription>
              Personalize your item with custom options
            </DialogDescription>
          </DialogHeader>
          <CustomizationOptions
            onCustomizationChange={setTempCustomization}
            initialCustomization={customization}
          />
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCustomization(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomizedAddToCart}>Add to Cart</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-primary/50 text-primary hover:bg-primary/5">
            <Clock className="w-4 h-4 mr-2" />
            Made to Order (30% Downpayment)
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Made to Order</DialogTitle>
            <DialogDescription>
              Secure your custom order with a 30% downpayment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Total Price:</span>
              <span className="font-semibold">
                ₱{data.price.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Required Downpayment (30%):</span>
              <span className="font-semibold">
                ₱{Math.round(data.price * 0.3).toLocaleString()}
              </span>
            </div>
            <Button className="w-full" onClick={handleMadeToOrder}>
              Proceed with Downpayment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddToCardSection;
