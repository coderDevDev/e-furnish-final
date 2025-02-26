'use client';

import { Color } from '@/lib/features/products/productsSlice';
import { cn } from '@/lib/utils';

interface ColorSelectionProps {
  onColorSelect: (color: Color & { price: number }) => void;
  selectedColor?: Color & { price: number };
}

const COLORS = [
  {
    id: 1,
    name: 'Light Oak',
    code: 'bg-[#D1B095]',
    hex: '#D1B095',
    value: '#D1B095',
    price: 1000
  },
  {
    id: 2,
    name: 'Warm Walnut',
    code: 'bg-[#B58F69]',
    hex: '#B58F69',
    value: '#B58F69',
    price: 1500
  },
  {
    id: 3,
    name: 'Chestnut Brown',
    code: 'bg-[#BA8A5B]',
    hex: '#BA8A5B',
    value: '#BA8A5B',
    price: 2000
  },
  {
    id: 4,
    name: 'Antique Leather',
    code: 'bg-[#9C7C53]',
    hex: '#9C7C53',
    value: '#9C7C53',
    price: 2500
  },
  {
    id: 5,
    name: 'Mahogany',
    code: 'bg-[#8C6A44]',
    hex: '#8C6A44',
    value: '#8C6A44',
    price: 3000
  },
  {
    id: 6,
    name: 'Soft Taupe',
    code: 'bg-[#D8C8B3]',
    category: 'Sofas',
    slug: '/shop?category=sofas',
    hex: '#D8C8B3'
  },
  {
    id: 7,
    name: 'Charcoal Grey',
    code: 'bg-[#4C4F56]',
    category: 'Chairs',
    slug: '/shop?category=chairs',
    hex: '#4C4F56',
    price: 1000
  },
  {
    id: 8,
    name: 'Maple',
    code: 'bg-[#D9B28A]',
    category: 'Tables',
    slug: '/shop?category=tables',
    hex: '#D9B28A',
    price: 1000
  },
  {
    id: 9,
    name: 'Slate Blue',
    code: 'bg-[#6C7D8D]',
    category: 'Beds',
    slug: '/shop?category=beds',
    hex: '#6C7D8D',
    price: 1000
  },
  {
    id: 10,
    name: 'Rich Ebony',
    code: 'bg-[#4A3D32]',
    hex: '#4A3D32',
    price: 1000
  }
];

const ColorSelection = ({
  onColorSelect,
  selectedColor
}: ColorSelectionProps) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {COLORS.map(color => (
          <button
            key={color.id}
            type="button"
            onClick={() => onColorSelect(color)}
            className={cn([
              'group relative flex h-12 w-full items-center justify-center rounded-lg transition-all hover:scale-105',
              color.code,
              selectedColor?.hex === color.hex &&
                'ring-2 ring-black ring-offset-2'
            ])}>
            <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white group-hover:block">
              <div>{color.name}</div>
              <div className="text-center">₱{color.price}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="text-sm text-gray-500">
        Selected: {selectedColor?.name}
        {selectedColor && (
          <span className="ml-2">(₱{selectedColor.price})</span>
        )}
      </div>
    </div>
  );
};

export default ColorSelection;
