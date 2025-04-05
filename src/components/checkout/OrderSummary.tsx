'use client';

import { useAppSelector, useAppDispatch } from '@/lib/hooks/redux';
import { CartItem } from '@/lib/features/carts/cartsSlice';
import { useEffect, useState } from 'react';
import { SHIPPING_CONFIG } from '@/config/shipping';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { setShippingFee } from '@/lib/features/checkout/checkoutSlice';

interface ShippingInfo {
  distance: number;
  fee: number;
  isWithinService: boolean;
}

interface Coordinates {
  lat: number;
  lng: number;
}

export default function OrderSummary() {
  const { items } = useAppSelector(state => state.carts);
  const [shipping, setShipping] = useState<ShippingInfo>({
    distance: 0,
    fee: 0,
    isWithinService: true
  });
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const address = useAppSelector(state => state.checkout.deliveryAddress);
  const dispatch = useAppDispatch();

  console.log({ address });
  const getCoordinatesFromAddress = async (
    address: string
  ): Promise<Coordinates> => {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    );
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    throw new Error('Location not found');
  };

  const calculateDistance = async (
    origin: Coordinates,
    destination: Coordinates
  ) => {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    );
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      // Convert distance from meters to kilometers
      return data.routes[0].distance / 1000;
    }
    throw new Error('Route not found');
  };

  // Calculate shipping fee immediately when address is available
  useEffect(() => {
    if (address?.address) {
      calculateShippingFee();
    }
  }, [address?.address]); // Only recalculate when address string changes

  const calculateShippingFee = async () => {
    if (!address?.address) {
      setShipping({
        distance: 0,
        fee: 0,
        isWithinService: true
      });
      dispatch(setShippingFee(0));
      return;
    }

    try {
      setCalculatingShipping(true);

      // Get coordinates for delivery address
      const destinationCoords = await getCoordinatesFromAddress(
        address.address
      );

      // Calculate distance
      const distance = await calculateDistance(
        SHIPPING_CONFIG.serviceAreaCenter,
        destinationCoords
      );

      console.log({ distance });

      const isWithinService = distance <= SHIPPING_CONFIG.maxServiceDistance;
      const fee = isWithinService
        ? SHIPPING_CONFIG.baseRate + distance * SHIPPING_CONFIG.ratePerKm
        : 0;

      setShipping({
        distance: Math.round(distance * 10) / 10,
        fee: Math.round(fee),
        isWithinService
      });

      // Dispatch shipping fee to Redux store
      dispatch(setShippingFee(Math.round(fee)));

      if (!isWithinService) {
        toast.error(
          `Sorry, this location is outside our service area (${SHIPPING_CONFIG.maxServiceDistance}km radius)`
        );
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
      toast.error('Failed to calculate shipping fee');
      setShipping({
        distance: 0,
        fee: 0,
        isWithinService: false
      });
      dispatch(setShippingFee(0));
    } finally {
      setCalculatingShipping(false);
    }
  };

  const calculateTotals = () => {
    const itemTotals = items.reduce(
      (acc, item: CartItem) => {
        const basePrice = item.product.price * item.quantity;
        const customizationCost =
          item.product.customization?.totalCustomizationCost || 0;
        const itemTotal = basePrice + customizationCost;
        const discountAmount =
          (itemTotal * (item.product.discount?.percentage || 0)) / 100;

        return {
          subtotal: acc.subtotal + itemTotal,
          discount: acc.discount + discountAmount,
          total: acc.total + (itemTotal - discountAmount)
        };
      },
      { subtotal: 0, discount: 0, total: 0 }
    );

    return {
      ...itemTotals,
      shippingFee: shipping.fee,
      grandTotal: itemTotals.total + shipping.fee
    };
  };

  const { subtotal, discount, shippingFee, grandTotal } = calculateTotals();

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
      <div className="space-y-4">
        <div className="flex justify-between text-black/60">
          <span>Subtotal</span>
          <span>₱{subtotal.toLocaleString()}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-₱{discount.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between text-black/60">
          <div className="flex items-center">
            <span>Shipping Fee</span>
            {calculatingShipping && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            )}
          </div>
          {!address ? (
            <span className="text-gray-400">Please enter delivery address</span>
          ) : shipping.isWithinService ? (
            <span>₱{shippingFee.toLocaleString()}</span>
          ) : (
            <span className="text-red-500">Not Available</span>
          )}
        </div>

        {shipping.distance > 0 && (
          <div className="text-sm text-black/40">
            Distance: {shipping.distance}km
          </div>
        )}

        <hr className="border-black/10" />

        <div className="flex justify-between font-medium text-lg">
          <span>Total</span>
          {shipping.isWithinService ? (
            <span>₱{grandTotal.toLocaleString()}</span>
          ) : (
            <span className="text-red-500">N/A</span>
          )}
        </div>

        {!shipping.isWithinService && (
          <div className="text-sm text-red-500 mt-2">
            ⚠️ This location is outside our service area (
            {SHIPPING_CONFIG.maxServiceDistance}km radius)
          </div>
        )}
      </div>
    </div>
  );
}
