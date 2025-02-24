'use client';

import { useAppSelector } from '@/lib/hooks/redux';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

const OrdersBtn = () => {
  return (
    <Link href="/orders" className="relative mr-[14px] p-1">
      <ShoppingBag className="w-[22px] h-[22px]" />
    </Link>
  );
};

export default OrdersBtn;
