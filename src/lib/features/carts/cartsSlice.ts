import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/types/product.types';
import { ProductCustomization } from '@/components/product-page/Header/CustomizationOptions';

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

export interface CartProduct extends Product {
  customization?: ProductCustomization & {
    totalCustomizationCost: number;
    isDownpayment?: boolean;
    downpaymentAmount?: number;
  };
}

interface CartState {
  items: CartItem[];
  total: number;
}

const initialState: CartState = {
  items: [],
  total: 0
};

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((acc, item) => {
    const basePrice = item.product.price * item.quantity;
    const customizationCost =
      item.product.customization?.totalCustomizationCost || 0;
    return acc + basePrice + customizationCost * item.quantity;
  }, 0);
};

const cartsSlice = createSlice({
  name: 'carts',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const newItem = action.payload;
      state.items.push(newItem);
      state.total = calculateTotal(state.items);
    },

    removeCartItem: (
      state,
      action: PayloadAction<{
        id: string;
        attributes: string[];
        customization?: ProductCustomization & {
          totalCustomizationCost: number;
        };
      }>
    ) => {
      if (!state.items) return;

      const { id, attributes, customization } = action.payload;

      // Find the exact item to remove by matching product.id instead of id
      const itemIndex = state.items.findIndex(
        item =>
          item.product.id.toString() === id &&
          JSON.stringify(item.attributes) === JSON.stringify(attributes) &&
          JSON.stringify(item.customization) === JSON.stringify(customization)
      );

      if (itemIndex > -1) {
        // Get the item to be removed
        const removedItem = state.items[itemIndex];

        // Update total quantities
        state.total -= removedItem.quantity;

        // Remove the item
        state.items = state.items.filter((_, index) => index !== itemIndex);

        // Recalculate totals
        state.total = calculateTotal(state.items);
      }
    },
    clearCart: state => {
      return initialState; // This ensures a complete state reset
    }
  }
});

export const { addToCart, removeCartItem, clearCart } = cartsSlice.actions;
export default cartsSlice.reducer;
