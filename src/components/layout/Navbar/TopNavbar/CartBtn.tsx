'use client';

import { useAppSelector } from '@/lib/hooks/redux';
import { RootState } from '@/lib/store';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const CartBtn = () => {
  const { cart } = useAppSelector(state => state.carts);

  console.log({ cart });
  return (
    <Link href="/cart" className="relative mr-[14px] p-1">
      <Image
        priority
        src="/icons/cart.svg"
        height={100}
        width={100}
        alt="cart"
        className="max-w-[22px] max-h-[22px]"
      />
      {cart && cart.items.length > 0 && (
        <span className="border bg-black text-white rounded-full w-fit-h-fit px-1 text-xs absolute -top-3 left-1/2 -translate-x-1/2">
          {cart.items.reduce((acc, item) => acc + item.quantity, 0)}
        </span>
      )}
    </Link>
  );
};

export default CartBtn;
