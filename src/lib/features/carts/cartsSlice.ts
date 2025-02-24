import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/types/product.types';
import { ProductCustomization } from '@/components/product-page/Header/CustomizationOptions';

export interface CartItem extends Product {
  quantity: number;
  attributes: string[];
  customization?: ProductCustomization & {
    totalCustomizationCost: number;
  };
}

interface CartState {
  cart: {
    items: CartItem[];
    totalQuantities: number;
  } | null;
  totalPrice: number;
  adjustedTotalPrice: number;
}

const initialState: CartState = {
  cart: {
    items: [],
    totalQuantities: 0
  },
  totalPrice: 0,
  adjustedTotalPrice: 0
};

const cartsSlice = createSlice({
  name: 'carts',
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<{
        id: string;
        name: string;
        srcUrl: string;
        price: number;
        attributes: string[];
        discount: {
          percentage: number;
          amount: number;
        };
        quantity: number;
        customization?: ProductCustomization & {
          totalCustomizationCost: number;
        };
      }>
    ) => {
      if (!state.cart) return;

      const { attributes, customization } = action.payload;

      // Find existing item with same id, attributes and customization
      const existingItemIndex = state.cart.items.findIndex(
        item =>
          item.id === action.payload.id &&
          JSON.stringify(item.attributes) === JSON.stringify(attributes) &&
          JSON.stringify(item.customization) === JSON.stringify(customization)
      );

      if (existingItemIndex > -1) {
        // Update existing item quantity
        state.cart.items[existingItemIndex].quantity += action.payload.quantity;
      } else {
        // Add new item
        state.cart.items.push({
          ...action.payload
        });
      }

      // Update total quantities
      state.cart.totalQuantities = state.cart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );

      // Calculate totals
      state.totalPrice = state.cart.items.reduce(
        (total, item) =>
          total +
          (item.price + (item.customization?.totalCustomizationCost || 0)) *
            item.quantity,
        0
      );

      state.adjustedTotalPrice = state.cart.items.reduce((total, item) => {
        const itemPrice =
          (item.price + (item.customization?.totalCustomizationCost || 0)) *
          item.quantity;
        const discount = (itemPrice * (item.discount?.percentage || 0)) / 100;
        return total + (itemPrice - discount);
      }, 0);
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
      if (!state.cart) return;

      const { id, attributes, customization } = action.payload;

      // Find the exact item to remove by matching product.id instead of id
      const itemIndex = state.cart.items.findIndex(
        item =>
          item.product.id.toString() === id &&
          JSON.stringify(item.attributes) === JSON.stringify(attributes) &&
          JSON.stringify(item.customization) === JSON.stringify(customization)
      );

      if (itemIndex > -1) {
        // Get the item to be removed
        const removedItem = state.cart.items[itemIndex];

        // Update total quantities
        state.cart.totalQuantities -= removedItem.quantity;

        // Remove the item
        state.cart.items = state.cart.items.filter(
          (_, index) => index !== itemIndex
        );

        // Recalculate totals
        state.totalPrice = state.cart.items.reduce(
          (total, item) =>
            total +
            (item.product.price +
              (item.customization?.totalCustomizationCost || 0)) *
              item.quantity,
          0
        );

        state.adjustedTotalPrice = state.cart.items.reduce((total, item) => {
          const itemPrice =
            (item.product.price +
              (item.customization?.totalCustomizationCost || 0)) *
            item.quantity;
          const discount =
            (itemPrice * (item.product.discount?.percentage || 0)) / 100;
          return total + (itemPrice - discount);
        }, 0);
      }
    },
    clearCart: state => {
      state.cart.items = [];
      state.totalPrice = 0;
      state.adjustedTotalPrice = 0;
    }
  }
});

export const { addToCart, removeCartItem, clearCart } = cartsSlice.actions;
export default cartsSlice.reducer;
