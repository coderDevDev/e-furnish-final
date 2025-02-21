import { cn } from '@/lib/utils';
import Link from 'next/link';
import React from 'react';

type DressStyleCardProps = {
  title: string;
  url: string;
  className?: string;
};

const DressStyleCard = ({ title, url, className }: DressStyleCardProps) => {
  return (
    <Link
      href={url}
      className={cn([
        'w-full md:h-full rounded-[20px] bg-white bg-top text-1xl md:text-2xl font-bold text-left py-4 md:py-[25px] px-6 md:px-9 bg-no-repeat bg-cover',
        className
      ])}>
      <span
        className="text-white text-1xl md:text-2xl font-bold
       bg-primary/90 p-2 rounded-md">
        {title}
      </span>
    </Link>
  );
};

export default DressStyleCard;
