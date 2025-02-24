'use client';

import { Button } from '@/components/ui/button';
import { Product } from '@/types/product.types';
import { ProductCustomization } from './CustomizationOptions';
import { useAppDispatch } from '@/lib/hooks/redux';
import { addToCart } from '@/lib/features/carts/cartsSlice';
import { toast } from 'sonner';

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
}

const AddToCardSection = ({ data, customization }: AddToCardSectionProps) => {
  const dispatch = useAppDispatch();

  const handleAddToCart = () => {
    if (!customization) {
      toast.error('Please select customization options');
      return;
    }

    // Calculate additional cost from customizations
    const componentsCost = Object.values(customization.components || {}).reduce(
      (total, componentId) => {
        const component = Object.values(components)
          .flat()
          .find(c => c.id === componentId);
        return total + (component?.price || 0);
      },
      0
    );

    const addonsCost = customization.addons.reduce((total, addonId) => {
      const addon = addons.find(a => a.id === addonId);
      return total + (addon?.price || 0);
    }, 0);

    const materialMultiplier =
      materials.find(m => m.id === customization.material)?.priceMultiplier ||
      1;

    const basePrice = data.price;
    const totalPrice =
      (basePrice + componentsCost + addonsCost) * materialMultiplier;

    const productWithCustomization = {
      ...data,
      price: totalPrice,
      attributes: ['default', 'default'] // Add appropriate attributes
    };

    dispatch(
      addToCart({
        product: productWithCustomization,
        quantity: 1,
        attributes: ['default', 'default'],
        customization: {
          ...customization,
          totalCustomizationCost: totalPrice - basePrice
        }
      })
    );
    toast.success('Added to cart successfully!');
  };

  return (
    <div className="flex space-x-4">
      <Button
        onClick={handleAddToCart}
        className="w-full rounded-xl bg-primary py-2 text-white hover:bg-primary/90">
        Add to Cart
      </Button>
    </div>
  );
};

export default AddToCardSection;
