import { calculateShippingCost } from '@/lib/utils/shipping';

// In your calculateTotals or similar function
const shippingFee = calculateShippingCost({
  province_name: state.shippingAddress?.province_name,
  city_name: state.shippingAddress?.city_name
});

// Update total with shipping
const total = subtotal + shippingFee - discount;
