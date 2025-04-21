'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  removeCartItem,
  updateQuantity,
  toggleItemSelection
} from '@/lib/features/carts/cartsSlice';
import { useAppDispatch } from '@/lib/hooks/redux';
import { ProductCustomization } from '../product-page/Header/CustomizationOptions';
import { Trash2, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface ProductCardProps {
  data: {
    product: {
      id: string;
      name: string;
      price: number;
      images: string[];
      stock: number;
      customization?: ProductCustomization;
    };
    quantity: number;
    selected?: boolean;
  };
  index: number;
}

const CustomizationDetails = ({ customization }: { customization: any }) => {
  if (!customization) return null;

  return (
    <div className="mt-1 text-sm">
      <div className="text-gray-600 font-medium">Customizations:</div>

      {customization.breakdown && customization.breakdown.length > 0 ? (
        <div className="ml-2 space-y-1 mt-1">
          {customization.breakdown.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-gray-500">
              <span>{item.details.displayName || item.fieldLabel}</span>
              {item.cost > 0 && (
                <span className="text-gray-600">
                  +₱{item.cost.toLocaleString()}
                </span>
              )}
            </div>
          ))}

          {customization.totalCustomizationCost > 0 && (
            <div className="flex justify-between text-gray-700 pt-1 border-t border-dashed border-gray-200">
              <span>Total customization:</span>
              <span>
                +₱{customization.totalCustomizationCost.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="ml-2 text-gray-500">
          {Object.entries(customization.fields || {})
            .filter(([_, value]) => value)
            .map(([key, value]: [string, any], i: number) => (
              <div key={i}>
                {key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())}
                : {value.toString()}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ data, index }: ProductCardProps) => {
  const dispatch = useAppDispatch();
  const { product, quantity, selected } = data;
  const [inputQuantity, setInputQuantity] = useState(quantity.toString());

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, Math.min(product.stock, quantity + change));
    dispatch(updateQuantity({ index, quantity: newQuantity }));
    setInputQuantity(newQuantity.toString());
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setInputQuantity('');
      return;
    }

    if (!/^\d+$/.test(value)) return;

    setInputQuantity(value);
  };

  const handleQuantityBlur = () => {
    let newQuantity = parseInt(inputQuantity || '1', 10);

    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
    } else if (newQuantity > product.stock) {
      toast.error(`Only ${product.stock} items available`);
      newQuantity = product.stock;
    }

    dispatch(updateQuantity({ index, quantity: newQuantity }));
    setInputQuantity(newQuantity.toString());
  };

  const handleRemoveItem = () => {
    dispatch(removeCartItem(index));
  };

  const handleToggleSelect = () => {
    dispatch(toggleItemSelection(index));
  };

  const finalPrice = product.price * quantity;

  return (
    <div
      className={cn(
        'flex items-center gap-4 border rounded-lg p-4 mb-3',
        selected && 'border-primary'
      )}>
      <Checkbox
        checked={selected}
        onCheckedChange={handleToggleSelect}
        className="h-5 w-5"
      />

      <div className="flex-1 flex items-center gap-4">
        <Image
          src={product.srcurl}
          alt={product.name}
          width={80}
          height={80}
          className="rounded-md object-cover"
        />

        <div className="flex-1">
          <h3 className="font-medium">{product.name}</h3>
          {product.customization && (
            <CustomizationDetails customization={product.customization} />
          )}
          <p className="text-sm text-gray-500">Stock: {product.stock}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="text"
            value={inputQuantity}
            onChange={handleQuantityInput}
            onBlur={handleQuantityBlur}
            className="w-16 text-center"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= product.stock}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this item from your cart?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemoveItem}
                  className="bg-red-600 hover:bg-red-700">
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <span className="font-medium">₱{finalPrice.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
