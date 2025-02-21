'use client';

import {
  Color,
  setColorSelection
} from '@/lib/features/products/productsSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks/redux';
import { RootState } from '@/lib/store';
import { cn } from '@/lib/utils';
import React from 'react';
import { IoMdCheckmark } from 'react-icons/io';
const colorsData: Color[] = [
  {
    name: 'Light Oak',
    code: 'bg-[#D1B095]',
    category: 'Sofas',
    slug: '/shop?category=sofas',
    hex: '#D1B095'
  },
  {
    name: 'Warm Walnut',
    code: 'bg-[#B58F69]',
    category: 'Chairs',
    slug: '/shop?category=chairs',
    hex: '#B58F69'
  },
  {
    name: 'Chestnut Brown',
    code: 'bg-[#BA8A5B]',
    category: 'Tables',
    slug: '/shop?category=tables',
    hex: '#BA8A5B'
  },
  {
    name: 'Antique Leather',
    code: 'bg-[#9C7C53]',
    category: 'Beds',
    slug: '/shop?category=beds',
    hex: '#9C7C53'
  },
  {
    name: 'Mahogany',
    code: 'bg-[#8C6A44]',
    category: 'Cabinets',
    slug: '/shop?category=cabinets',
    hex: '#8C6A44'
  },
  {
    name: 'Soft Taupe',
    code: 'bg-[#D8C8B3]',
    category: 'Sofas',
    slug: '/shop?category=sofas',
    hex: '#D8C8B3'
  },
  {
    name: 'Charcoal Grey',
    code: 'bg-[#4C4F56]',
    category: 'Chairs',
    slug: '/shop?category=chairs',
    hex: '#4C4F56'
  },
  {
    name: 'Maple',
    code: 'bg-[#D9B28A]',
    category: 'Tables',
    slug: '/shop?category=tables',
    hex: '#D9B28A'
  },
  {
    name: 'Slate Blue',
    code: 'bg-[#6C7D8D]',
    category: 'Beds',
    slug: '/shop?category=beds',
    hex: '#6C7D8D'
  },
  {
    name: 'Rich Ebony',
    code: 'bg-[#4A3D32]',
    category: 'Cabinets',
    slug: '/shop?category=cabinets',
    hex: '#4A3D32'
  }
];

const ColorSelection = () => {
  const { colorSelection } = useAppSelector(
    (state: RootState) => state.products
  );
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-col">
      <span className="text-sm sm:text-base text-black/60 mb-4">
        Select Colors
      </span>
      <div className="flex items-center flex-wrap space-x-3 sm:space-x-4">
        {colorsData.map((color, index) => (
          <button
            key={index}
            type="button"
            className={cn([
              color.code,
              'rounded-full w-9 sm:w-10 h-9 sm:h-10 flex items-center justify-center'
            ])}
            onClick={() => dispatch(setColorSelection(color))}>
            {colorSelection.name === color.name && (
              <IoMdCheckmark className="text-base text-white" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ColorSelection;
