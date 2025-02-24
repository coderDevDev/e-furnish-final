import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/types/product.types';
import { ProductCustomization } from '@/components/product-page/Header/CustomizationOptions';

interface CartItem extends Product {
  quantity: number;
  customization?: ProductCustomization & {
    totalCustomizationCost: number;
  };
}

interface CartState {
  cart: {
    items: CartItem[];
  } | null;
  totalPrice: number;
  adjustedTotalPrice: number;
}

const initialState: CartState = {
  cart: {
    items: []
  },
  totalPrice: 0,
  adjustedTotalPrice: 0
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<
        Product & {
          customization?: ProductCustomization & {
            totalCustomizationCost: number;
          };
        }
      >
    ) => {
      if (!state.cart) {
        state.cart = { items: [] };
      }

      const { customization, ...product } = action.payload;

      const existingItemIndex = state.cart.items.findIndex(
        item =>
          item.id === product.id &&
          JSON.stringify(item.customization) === JSON.stringify(customization)
      );

      if (existingItemIndex > -1) {
        state.cart.items[existingItemIndex].quantity += 1;
      } else {
        state.cart.items.push({
          ...product,
          quantity: 1,
          customization
        });
      }

      // Recalculate totals
      state.totalPrice = state.cart.items.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      state.adjustedTotalPrice = state.cart.items.reduce((total, item) => {
        const itemPrice = item.price * item.quantity;
        const discount = (itemPrice * (item.discount?.percentage || 0)) / 100;
        return total + (itemPrice - discount);
      }, 0);
    },
    removeCartItem: (
      state,
      action: PayloadAction<{ id: string; attributes: string[] }>
    ) => {
      if (!state.cart) return;

      const itemIndex = state.cart.items.findIndex(
        item => item.id === action.payload.id
      );

      if (itemIndex > -1) {
        state.cart.items[itemIndex].quantity -= 1;

        // Recalculate totals
        state.totalPrice = state.cart.items.reduce((total, item) => {
          return total + item.price * item.quantity;
        }, 0);

        state.adjustedTotalPrice = state.cart.items.reduce((total, item) => {
          const itemPrice = item.price * item.quantity;
          const discount = (itemPrice * (item.discount?.percentage || 0)) / 100;
          return total + (itemPrice - discount);
        }, 0);
      }
    },
    remove: (
      state,
      action: PayloadAction<{
        id: string;
        attributes: string[];
        quantity: number;
      }>
    ) => {
      if (!state.cart) return;

      state.cart.items = state.cart.items.filter(
        item => item.id !== action.payload.id
      );

      // Recalculate totals
      state.totalPrice = state.cart.items.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      state.adjustedTotalPrice = state.cart.items.reduce((total, item) => {
        const itemPrice = item.price * item.quantity;
        const discount = (itemPrice * (item.discount?.percentage || 0)) / 100;
        return total + (itemPrice - discount);
      }, 0);
    }
  }
});

export const { addToCart, removeCartItem, remove } = cartSlice.actions;
export default cartSlice.reducer;
