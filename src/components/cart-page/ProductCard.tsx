'use client';

import React from 'react';
import Image from 'next/image';
import { removeCartItem } from '@/lib/features/carts/cartsSlice';
import { useAppDispatch } from '@/lib/hooks/redux';
import { ProductCustomization } from '../product-page/Header/CustomizationOptions';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

interface CartItem {
  product: {
    id: number;
    title: string;
    srcurl: string;
    price: number;
    discount: {
      percentage: number;
    };
  };
  quantity: number;
  attributes: string[];
  customization?: ProductCustomization & {
    totalCustomizationCost: number;
  };
}

const ProductCard = ({ data }: { data: CartItem }) => {
  const dispatch = useAppDispatch();

  //console.log({ data });

  // Calculate total price including customizations
  const itemPrice =
    data.product.price + (data.customization?.totalCustomizationCost || 0);
  const totalPrice = itemPrice * data.quantity;
  const discount =
    (totalPrice * (data.product.discount?.percentage || 0)) / 100;
  const finalPrice = totalPrice - discount;

  const handleRemoveItem = () => {
    dispatch(
      removeCartItem({
        id: data.product.id.toString(),
        attributes: data.attributes,
        customization: data.customization
      })
    );
  };

  return (
    <div className="flex items-center justify-between py-5">
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-xl overflow-hidden">
          <Image
            src={data.product.srcurl}
            alt={data.product.title}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-medium mb-1">
            {data.product.title}
          </h3>

          {/* Display customizations */}
          {data.customization && (
            <div className="space-y-2 text-sm text-gray-600">
              {data.customization.material && (
                <p>Material: {data.customization.material}</p>
              )}
              {data.customization.color && (
                <div className="flex items-center gap-2">
                  <span>Color: {data.customization.color.name}</span>
                  <div
                    className={cn(
                      data.customization.color.code,
                      'w-4 h-4 rounded-full ring-1 ring-gray-200'
                    )}
                  />
                </div>
              )}
              {data.customization.dimensions && (
                <p>Size: {data.customization.dimensions.size}cm</p>
              )}
              {data.customization.addons.length > 0 && (
                <div>
                  <p className="font-medium">Add-ons:</p>
                  <ul className="ml-4">
                    {data.customization.addons.map(addon => (
                      <li key={addon.id} className="flex justify-between">
                        <span>
                          {addon.name} ({addon.quantity} {addon.unit}
                          {addon.quantity > 1 ? 's' : ''})
                        </span>
                        <span className="ml-4">
                          ₱{(addon.price * addon.quantity).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm sm:text-base">
              ₱{itemPrice.toLocaleString()}
            </span>
            {data.product.discount?.percentage > 0 && (
              <span className="text-[10px] sm:text-xs py-1 px-2 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
                -{data.product.discount.percentage}%
              </span>
            )}
            <span className="text-sm sm:text-base">×{data.quantity}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-black/60 hover:text-red-600 transition-colors">
              <Trash2 className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Item from Cart</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{data.product.title}" from your
                cart? This action cannot be undone.
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
  );
};

export default ProductCard;
