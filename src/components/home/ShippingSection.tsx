'use client';

import { useRef, useEffect } from 'react';
import { FIRST_DISTRICT_MUNICIPALITIES } from '@/lib/utils/shipping';
import Image from 'next/image';

export default function ShippingSection() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">
          Shipping Information
        </h2>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Delivery Policy</h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-green-600 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Free Shipping</h4>
                    <p className="text-gray-600">
                      Available for all customers in the First District of
                      Camarines Sur:
                      <span className="font-medium">
                        {' '}
                        {FIRST_DISTRICT_MUNICIPALITIES.join(', ')}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-sm">₱</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Standard Shipping - ₱500</h4>
                    <p className="text-gray-600">
                      For all other locations in Region V and across the
                      Philippines
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-amber-600 text-sm">i</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Delivery Time</h4>
                    <p className="text-gray-600">
                      2-5 business days for Camarines Sur, 5-10 business days
                      for other locations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-[400px] rounded-lg overflow-hidden shadow-md">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>

            {/* Map of Camarines Sur with color-coded districts */}
            <Image
              src="/images/camarines-sur-map.jpg"
              alt="Camarines Sur Map showing shipping zones"
              fill
              className="object-cover"
            />

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-20 bg-white/90 p-3 rounded-lg shadow-sm">
              <div className="text-sm font-medium mb-2">Shipping Zones</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-4 w-4 bg-green-500 rounded-sm"></div>
                <div className="text-xs">First District - Free Shipping</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-blue-300 rounded-sm"></div>
                <div className="text-xs">Other Districts - ₱500</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
