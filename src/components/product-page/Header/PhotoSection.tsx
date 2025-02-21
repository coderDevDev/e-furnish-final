'use client';

import { Product } from '@/types/product.types';
import Image from 'next/image';
import React, { useState } from 'react';
import { useAppSelector } from '@/lib/hooks/redux';
import { RootState } from '@/lib/store';
import { cn } from '@/lib/utils';

const PhotoSection = ({ data }: { data: Product }) => {
  const [selected, setSelected] = useState<string>(data.srcurl);
  const { colorSelection } = useAppSelector(
    (state: RootState) => state.products
  );

  // Check if color has been actively selected (not the initial state)
  const isColorSelected =
    colorSelection.name !== 'Brown' || colorSelection.hex !== '#4F4631';

  return (
    <div className="flex flex-col-reverse lg:flex-row lg:space-x-3.5">
      {data?.gallery && data.gallery.length > 0 && (
        <div className="flex lg:flex-col space-x-3 lg:space-x-0 lg:space-y-3.5 w-full lg:w-fit items-center lg:justify-start justify-center">
          {data.gallery.map((photo, index) => (
            <button
              key={index}
              type="button"
              className="bg-[#F0EEED] rounded-[5px] xl:rounded-[5px] w-full max-w-[111px] xl:max-w-[152px] max-h-[106px] xl:max-h-[167px] xl:min-h-[167px] aspect-square overflow-hidden"
              onClick={() => setSelected(photo)}>
              <div
                className={`relative w-full h-full ${
                  selected === photo ? 'border-2 border-primary' : ''
                }`}>
                <Image
                  src={photo}
                  width={152}
                  height={167}
                  className="rounded-md w-full h-full object-cover
               
                  "
                  alt={data.title}
                  priority
                />
                {/* {isColorSelected && (
                  <div
                    className="absolute inset-0 mix-blend-multiply"
                    style={{ backgroundColor: colorSelection.hex }}
                  />
                )} */}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center bg-[#F0EEED] rounded-[13px] sm:rounded-[20px] w-full sm:w-96 md:w-full mx-auto h-full max-h-[530px] min-h-[330px] lg:min-h-[380px] xl:min-h-[530px] overflow-hidden mb-3 lg:mb-0">
        <div className="relative w-full h-full">
          <Image
            src={selected}
            width={444}
            height={530}
            className="rounded-md w-full h-full object-cover hover:scale-110 transition-all duration-500"
            alt={data.title}
            priority
            unoptimized
          />
          {isColorSelected && (
            <div
              className="absolute inset-0 mix-blend-multiply"
              style={{ backgroundColor: colorSelection.hex }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoSection;
