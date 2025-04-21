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
import { customizationService } from '@/lib/services/customizationService';

// Define expected unit types
const UNIT_TYPES = [
  { value: 'cm', label: 'cm', priceMultiplier: 1 },
  { value: 'inches', label: 'inches', priceMultiplier: 2.54 },
  { value: 'ft', label: 'ft', priceMultiplier: 30.48 }
];

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

const PriceBreakdown = ({
  basePrice,
  customization,
  customizationOptions
}: {
  basePrice: number;
  customization: ProductCustomization;
  customizationOptions: any[];
}) => {
  // Calculate costs for each selected option
  const breakdownItems = [];
  let totalAdditionalCost = 0;

  // Process each customization field to create breakdown items
  Object.entries(customization.fields || {}).forEach(
    ([fieldName, fieldValue]) => {
      if (!fieldValue) return; // Skip if no value selected

      // Find the corresponding field configuration
      const fieldConfig = customizationOptions.find(
        opt => opt.fieldName === fieldName
      );
      if (!fieldConfig || !fieldConfig.enabled) return;

      let itemCost = 0;
      let itemLabel = fieldConfig.fieldName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());

      switch (fieldConfig.fieldType) {
        case 'dropdown':
        case 'color':
          // For dropdown and color fields
          if (fieldValue && Array.isArray(fieldConfig.options)) {
            const selectedOption = fieldConfig.options.find(
              opt => opt.name === fieldValue
            );
            if (selectedOption && selectedOption.price) {
              itemCost = selectedOption.price;
              itemLabel = `${itemLabel}: ${selectedOption.name}`;
            }
          }
          break;

        case 'dimensions':
          // For dimensions fields
          if (
            fieldValue &&
            typeof fieldValue === 'object' &&
            fieldConfig.pricingImpact
          ) {
            const { width = 0, height = 0, depth = 0 } = fieldValue as any;
            const area = width * height * (depth || 1);
            itemCost = area * (fieldConfig.pricingImpact.pricePerUnit || 0);
            itemLabel = `${itemLabel}: ${width}x${height}${
              depth ? 'x' + depth : ''
            }`;
          }
          break;

        case 'text':
          // For text fields like engraving
          if (typeof fieldValue === 'string' && fieldConfig.pricingImpact) {
            const basePrice = fieldConfig.pricingImpact.basePrice || 0;
            const letterPrice =
              fieldValue.length *
              (fieldConfig.pricingImpact.pricePerLetter || 0);
            itemCost = basePrice + letterPrice;
            itemLabel = `${itemLabel} (${fieldValue.length} characters)`;
          }
          break;

        case 'multi-select':
          // For multi-select fields like addons
          if (Array.isArray(fieldValue) && Array.isArray(fieldConfig.options)) {
            fieldValue.forEach(selected => {
              const option = fieldConfig.options.find(
                opt => opt.name === selected
              );
              if (option && option.price) {
                const optionItemCost = option.price;
                breakdownItems.push({
                  label: `${itemLabel}: ${option.name}`,
                  cost: optionItemCost
                });
                totalAdditionalCost += optionItemCost;
              }
            });
            return; // Skip adding the main item since we added individual items
          }
          break;

        case 'toggle':
        case 'file':
          // For toggle and file fields
          if (
            fieldValue &&
            fieldConfig.pricingImpact &&
            fieldConfig.pricingImpact.flatFee
          ) {
            itemCost = fieldConfig.pricingImpact.flatFee;
          }
          break;
      }

      if (itemCost > 0) {
        breakdownItems.push({ label: itemLabel, cost: itemCost });
        totalAdditionalCost += itemCost;
      }
    }
  );

  // Get pricing method from options
  const pricingConfig = customizationOptions.find(
    opt => opt.fieldName === 'pricing'
  );
  const calculationMethod =
    pricingConfig?.options?.calculationMethod || 'additive';

  // Calculate final price based on pricing method
  let finalPrice = basePrice;
  let pricingDescription = '';

  switch (calculationMethod) {
    case 'additive':
      finalPrice = basePrice + totalAdditionalCost;
      pricingDescription = 'Base price + customizations';
      break;
    case 'replacement':
      finalPrice = totalAdditionalCost > 0 ? totalAdditionalCost : basePrice;
      pricingDescription = 'Customization replaces base price';
      break;
    case 'percentage':
      finalPrice = basePrice * (1 + totalAdditionalCost / 100);
      pricingDescription = 'Base price + percentage adjustment';
      break;
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 mb-2">{pricingDescription}</div>

      <div className="flex justify-between items-center">
        <span>Base Price:</span>
        <span>₱{basePrice.toLocaleString()}</span>
      </div>

      {breakdownItems.map((item, index) => (
        <div key={index} className="flex justify-between items-center text-sm">
          <span>{item.label}:</span>
          <span>+₱{item.cost.toLocaleString()}</span>
        </div>
      ))}

      {breakdownItems.length > 0 && (
        <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
          <span>Total Customization:</span>
          <span>+₱{totalAdditionalCost.toLocaleString()}</span>
        </div>
      )}

      <div className="flex justify-between items-center font-medium text-base pt-2 border-t mt-2">
        <span>Final Price:</span>
        <span className="text-primary">
          ₱{Math.round(finalPrice).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

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
  const [customizationOptions, setCustomizationOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch customization options when component mounts
  useEffect(() => {
    const fetchCustomizationOptions = async () => {
      if (!data.id) return;

      try {
        setIsLoading(true);
        const options =
          await customizationService.getProductCustomizationOptions(data.id);
        console.log('Fetched customization options:', options);
        setCustomizationOptions(options || []);
      } catch (error) {
        console.error('Error fetching customization options:', error);
        toast.error('Failed to load customization options');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomizationOptions();
  }, [data.id]);

  const calculateCustomizationCost = (customization: ProductCustomization) => {
    if (!customization)
      return {
        basePrice: data.price,
        totalPrice: data.price,
        customizationCost: 0
      };

    let additionalCost = 0;

    // Process each customization field
    Object.entries(customization.fields || {}).forEach(
      ([fieldName, fieldValue]) => {
        // Find the corresponding field configuration in our options
        const fieldConfig = customizationOptions.find(
          opt => opt.fieldName === fieldName
        );
        if (!fieldConfig || !fieldConfig.enabled) return;

        switch (fieldConfig.fieldType) {
          case 'dropdown':
          case 'color':
            // For dropdown and color fields, add the price of the selected option
            if (fieldValue && Array.isArray(fieldConfig.options)) {
              const selectedOption = fieldConfig.options.find(
                opt => opt.name === fieldValue
              );
              if (selectedOption) {
                additionalCost += selectedOption.price || 0;
              }
            }
            break;

          case 'dimensions':
            // For dimensions, calculate based on size and price per unit
            if (
              fieldValue &&
              typeof fieldValue === 'object' &&
              fieldConfig.pricingImpact
            ) {
              const { width = 0, height = 0, depth = 0 } = fieldValue as any;
              const area = width * height * (depth || 1);
              additionalCost +=
                area * (fieldConfig.pricingImpact.pricePerUnit || 0);
            }
            break;

          case 'text':
            // For text fields like engraving, calculate based on text length
            if (typeof fieldValue === 'string' && fieldConfig.pricingImpact) {
              additionalCost += fieldConfig.pricingImpact.basePrice || 0;
              additionalCost +=
                fieldValue.length *
                (fieldConfig.pricingImpact.pricePerLetter || 0);
            }
            break;

          case 'multi-select':
            // For multi-select fields, add the price of each selected option
            if (
              Array.isArray(fieldValue) &&
              Array.isArray(fieldConfig.options)
            ) {
              fieldValue.forEach(selected => {
                const option = fieldConfig.options.find(
                  opt => opt.name === selected
                );
                if (option) {
                  additionalCost += option.price || 0;
                }
              });
            }
            break;

          case 'toggle':
          case 'file':
            // For toggle and file fields, add the flat fee if enabled
            if (fieldValue && fieldConfig.pricingImpact) {
              additionalCost += fieldConfig.pricingImpact.flatFee || 0;
            }
            break;
        }
      }
    );

    // Get pricing method from options
    const pricingConfig = customizationOptions.find(
      opt => opt.fieldName === 'pricing'
    );
    const calculationMethod =
      pricingConfig?.options?.calculationMethod || 'additive';

    // Calculate final price based on pricing method
    let totalPrice = data.price;

    switch (calculationMethod) {
      case 'additive':
        totalPrice = data.price + additionalCost;
        break;
      case 'replacement':
        totalPrice = additionalCost;
        break;
      case 'percentage':
        totalPrice = data.price * (1 + additionalCost / 100);
        break;
    }

    return {
      basePrice: data.price,
      totalPrice,
      customizationCost: totalPrice - data.price
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
      toast.error('Please customize your product first');
      return;
    }

    console.log({ customizationOptions });

    // Get pricing method from options
    const pricingConfig = customizationOptions.find(
      opt => opt.fieldName === 'pricing'
    );
    const calculationMethod =
      pricingConfig?.options?.calculationMethod || 'additive';

    // Calculate customization cost
    let totalAdditionalCost = 0;
    // Create breakdown items array to store detailed cost information
    const breakdownItems = [];

    console.log({ tempCustomization });

    // Process each customization field
    Object.entries(tempCustomization.fields || {}).forEach(
      ([fieldName, fieldValue]) => {
        if (!fieldValue) return; // Skip if no value selected

        // Find the corresponding field configuration
        const fieldConfig = customizationOptions.find(
          opt => opt.fieldName === fieldName
        );
        if (!fieldConfig || !fieldConfig.enabled) return;

        // Create a breakdown item for this field
        const breakdownItem: any = {
          fieldName,
          fieldLabel: fieldConfig.fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase()),
          fieldType: fieldConfig.fieldType,
          selectedValue: fieldValue,
          cost: 0,
          details: {}
        };

        // Calculate cost based on field type
        switch (fieldConfig.fieldType) {
          case 'dropdown':
          case 'color':
            // For dropdown and color fields
            if (fieldValue && Array.isArray(fieldConfig.options)) {
              const selectedOption = fieldConfig.options.find(
                opt => opt.name === fieldValue
              );
              if (selectedOption) {
                breakdownItem.cost = selectedOption.price || 0;
                breakdownItem.details = {
                  ...selectedOption,
                  displayName: `${breakdownItem.fieldLabel}: ${selectedOption.name}`
                };
                totalAdditionalCost += breakdownItem.cost;
              }
            }
            break;

          case 'dimensions':
            // For dimensions fields
            if (
              fieldValue &&
              typeof fieldValue === 'object' &&
              fieldConfig.pricingImpact
            ) {
              const { width = 0, height = 0, depth = 0 } = fieldValue as any;
              const area = width * height * (depth || 1);
              breakdownItem.cost =
                area * (fieldConfig.pricingImpact.pricePerUnit || 0);
              breakdownItem.details = {
                width,
                height,
                depth,
                area,
                pricePerUnit: fieldConfig.pricingImpact.pricePerUnit || 0,
                displayName: `${breakdownItem.fieldLabel}: ${width}×${height}${
                  depth ? '×' + depth : ''
                }`
              };
              totalAdditionalCost += breakdownItem.cost;
            }
            break;

          case 'text':
            // For text fields like engraving
            if (typeof fieldValue === 'string' && fieldConfig.pricingImpact) {
              const basePrice = fieldConfig.pricingImpact.basePrice || 0;
              const letterPrice =
                fieldValue.length *
                (fieldConfig.pricingImpact.pricePerLetter || 0);
              breakdownItem.cost = basePrice + letterPrice;
              breakdownItem.details = {
                text: fieldValue,
                basePrice,
                letterPrice: fieldConfig.pricingImpact.pricePerLetter || 0,
                characterCount: fieldValue.length,
                displayName: `${breakdownItem.fieldLabel} (${fieldValue.length} characters)`
              };
              totalAdditionalCost += breakdownItem.cost;
            }
            break;

          case 'design':
            // For design/carve fields
            if (fieldValue && Array.isArray(fieldConfig.options)) {
              const selectedDesign = fieldConfig.options.find(
                opt => opt.name === fieldValue
              );
              if (selectedDesign) {
                breakdownItem.cost = selectedDesign.price || 0;
                breakdownItem.details = {
                  ...selectedDesign,
                  displayName: `${breakdownItem.fieldLabel}: ${selectedDesign.name}`
                };
                totalAdditionalCost += breakdownItem.cost;
              }
            }
            break;

          case 'multi-select':
            // For multi-select fields like addons
            if (
              Array.isArray(fieldValue) &&
              Array.isArray(fieldConfig.options)
            ) {
              const selectedItems = [];
              let totalCost = 0;

              fieldValue.forEach(selected => {
                const option = fieldConfig.options.find(
                  opt => opt.name === selected
                );
                if (option) {
                  const cost = option.price || 0;
                  selectedItems.push({
                    name: option.name,
                    price: cost,
                    displayName: option.name
                  });
                  totalCost += cost;
                }
              });

              breakdownItem.cost = totalCost;
              breakdownItem.details = {
                selectedItems,
                displayName: `${breakdownItem.fieldLabel}: ${selectedItems
                  .map(i => i.name)
                  .join(', ')}`
              };
              totalAdditionalCost += totalCost;
            }
            break;

          case 'toggle':
          case 'file':
            // For toggle and file fields
            if (
              fieldValue &&
              fieldConfig.pricingImpact &&
              fieldConfig.pricingImpact.flatFee
            ) {
              breakdownItem.cost = fieldConfig.pricingImpact.flatFee;
              breakdownItem.details = {
                flatFee: fieldConfig.pricingImpact.flatFee,
                displayName: `${breakdownItem.fieldLabel}`
              };
              totalAdditionalCost += breakdownItem.cost;
            }
            break;
        }

        // Only add items that have a cost or selection
        if (
          breakdownItem.cost > 0 ||
          Object.keys(breakdownItem.details).length > 0
        ) {
          breakdownItems.push(breakdownItem);
        }
      }
    );

    // Calculate final price based on pricing method
    let finalPrice = data.price;

    console.log({ calculationMethod, totalAdditionalCost });

    switch (calculationMethod) {
      case 'additive':
        finalPrice = data.price + totalAdditionalCost;
        break;
      case 'replacement':
        finalPrice = totalAdditionalCost > 0 ? totalAdditionalCost : data.price;
        break;
      case 'percentage':
        finalPrice = data.price * (1 + totalAdditionalCost / 100);
        break;
    }

    const cartItem: CartItem = {
      product: {
        ...data,
        price: Math.round(finalPrice),
        customization: {
          ...tempCustomization,
          totalCustomizationCost: totalAdditionalCost,
          breakdown: breakdownItems,
          pricingMethod: calculationMethod,
          basePrice: data.price
        }
      },
      quantity: 1
    };

    console.log({ cartItem });

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
      {/* {items.length > 0 && (
        <Button
          onClick={handleClearCart}
          variant="outline"
          className="w-full border-red-500 text-red-500 hover:bg-red-50">
          Clear Cart ({items.length} items)
        </Button>
      )} */}

      <Button
        onClick={handleDirectAddToCart}
        className="w-full bg-primary hover:bg-primary/90">
        <ShoppingCart className="w-4 h-4 mr-2" />
        Add to Cart
      </Button>

      {customizationOptions.length > 0 && (
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
              <DialogTitle>Customize Your {data.title}</DialogTitle>
              <DialogDescription>
                Personalize your item with custom options
              </DialogDescription>
            </DialogHeader>
            {isLoading ? (
              <div className="flex justify-center py-8">
                Loading customization options...
              </div>
            ) : (
              <>
                <CustomizationOptions
                  onCustomizationChange={setTempCustomization}
                  initialCustomization={customization}
                  customizationOptions={customizationOptions}
                />
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-medium text-lg mb-3">Price Summary</h3>

                  {tempCustomization && (
                    <PriceBreakdown
                      basePrice={data.price}
                      customization={tempCustomization}
                      customizationOptions={customizationOptions}
                    />
                  )}
                </div>
              </>
            )}
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
      )}

      {/* <Dialog>
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
      </Dialog> */}
    </div>
  );
};

export default AddToCardSection;
