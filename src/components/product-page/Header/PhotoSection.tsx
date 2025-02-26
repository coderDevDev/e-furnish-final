'use client';

import { Product } from '@/types/product.types';
import Image from 'next/image';
import React, { useState } from 'react';
import { useAppSelector } from '@/lib/hooks/redux';
import { RootState } from '@/lib/store';
import { cn } from '@/lib/utils';

const PhotoSection = ({ data }: { data: Product }) => {
  //console.log({ data });
  const [selected, setSelected] = useState<string>(data.srcurl);
  const { colorSelection } = useAppSelector(
    (state: RootState) => state.products
  );

  const isColorSelected = colorSelection?.hex && colorSelection.hex !== '';

  return (
    <div className="flex flex-col-reverse lg:flex-row lg:space-x-3.5">
      {data?.gallery && data.gallery.length > 0 && (
        <div className="flex lg:flex-col space-x-3 lg:space-x-0 lg:space-y-3.5 w-full lg:w-fit items-center lg:justify-start justify-center">
          {data.gallery.map((photo, index) => (
            <button
              key={index}
              type="button"
              className="relative w-[72px] h-[72px] sm:w-[96px] sm:h-[96px] rounded-[13px] sm:rounded-[20px] overflow-hidden"
              onClick={() => setSelected(photo)}>
              <Image
                src={photo}
                fill
                className="object-cover"
                alt={data.title}
                priority
              />
              {/* {isColorSelected && (
                <div
                  className="absolute inset-0 mix-blend-multiply"
                  style={{ backgroundColor: colorSelection.hex }}
                />
              )} */}
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
