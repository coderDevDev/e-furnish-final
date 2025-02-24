'use client';

import {
  Color,
  setColorSelection
} from '@/lib/features/products/productsSlice';
import { useAppDispatch } from '@/lib/hooks/redux';
import { cn } from '@/lib/utils';
import { IoMdCheckmark } from 'react-icons/io';

interface ColorSelectionProps {
  onColorSelect: (color: Color | null) => void;
  selectedColor?: Color | null;
}

const colorsData: Color[] = [
  {
    id: 1,
    name: 'Light Oak',
    code: 'bg-[#D1B095]',
    hex: '#D1B095',
    value: '#D1B095'
  },
  {
    id: 2,
    name: 'Warm Walnut',
    code: 'bg-[#B58F69]',
    hex: '#B58F69'
  },
  {
    id: 3,
    name: 'Chestnut Brown',
    code: 'bg-[#BA8A5B]',
    hex: '#BA8A5B'
  },
  {
    id: 4,
    name: 'Antique Leather',
    code: 'bg-[#9C7C53]',
    hex: '#9C7C53'
  },
  {
    id: 5,
    name: 'Mahogany',
    code: 'bg-[#8C6A44]',
    hex: '#8C6A44'
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
    hex: '#4C4F56'
  },
  {
    id: 8,
    name: 'Maple',
    code: 'bg-[#D9B28A]',
    category: 'Tables',
    slug: '/shop?category=tables',
    hex: '#D9B28A'
  },
  {
    id: 9,
    name: 'Slate Blue',
    code: 'bg-[#6C7D8D]',
    category: 'Beds',
    slug: '/shop?category=beds',
    hex: '#6C7D8D'
  },
  {
    id: 10,
    name: 'Rich Ebony',
    code: 'bg-[#4A3D32]',
    hex: '#4A3D32'
  }
];

const ColorSelection = ({
  onColorSelect,
  selectedColor
}: ColorSelectionProps) => {
  const dispatch = useAppDispatch();

  const handleColorSelect = (color: Color | null) => {
    onColorSelect(color);
    dispatch(
      setColorSelection(
        color || { id: 0, name: '', code: '', hex: '', value: '' }
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={cn(
            'rounded-full w-9 sm:w-10 h-9 sm:h-10 flex items-center justify-center border-2',
            !selectedColor ? 'border-primary' : 'border-gray-200'
          )}
          onClick={() => handleColorSelect(null)}>
          <span className="text-xs">None</span>
        </button>
        {colorsData.map(color => (
          <button
            key={color.id}
            type="button"
            className={cn([
              color.code,
              'rounded-full w-9 sm:w-10 h-9 sm:h-10 flex items-center justify-center',
              selectedColor?.id === color.id &&
                'ring-2 ring-primary ring-offset-2'
            ])}
            onClick={() => handleColorSelect(color)}>
            {selectedColor?.id === color.id && (
              <IoMdCheckmark className="text-base text-white" />
            )}
          </button>
        ))}
      </div>
      {selectedColor && (
        <p className="text-sm text-gray-500">Selected: {selectedColor.name}</p>
      )}
    </div>
  );
};

export default ColorSelection;
