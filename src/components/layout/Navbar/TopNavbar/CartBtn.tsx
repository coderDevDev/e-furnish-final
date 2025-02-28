'use client';

import { useAppSelector } from '@/lib/hooks/redux';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

const CartBtn = () => {
  // Access the cart state
  const { items } = useAppSelector(state => state.carts);

  // Calculate total items in the cart
  const totalItems = (items || []).reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  return (
    <Link href="/cart" className="relative mr-2">
      <ShoppingCart className="w-6 h-6" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
          {totalItems}
        </span>
      )}
    </Link>
  );
};

export default CartBtn;
