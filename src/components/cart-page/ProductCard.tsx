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

  const finalPrice =
    product.price * quantity +
    (product.customization?.totalCustomizationCost || 0);

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
            <div className="text-sm text-gray-500 mt-1">
              <p>Customizations:</p>
            </div>
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
