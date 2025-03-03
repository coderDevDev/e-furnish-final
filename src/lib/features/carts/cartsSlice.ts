import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/types/product.types';
import { ProductCustomization } from '@/components/product-page/Header/CustomizationOptions';

export interface CartItem {
  product: CartProduct;
  quantity: number;
  selected?: boolean;
}

export interface CartProduct extends Product {
  images: string[];
  stock: number;
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

const calculateTotal = (items: CartItem[]) => {
  return items
    .filter(item => item.selected)
    .reduce((total, item) => {
      const basePrice = item.product.price * item.quantity;
      const customizationCost =
        (item.product.customization?.totalCustomizationCost || 0) *
        item.quantity;
      const itemTotal = basePrice + customizationCost;
      const discount =
        (itemTotal * (item.product.discount?.percentage || 0)) / 100;
      return total + (itemTotal - discount);
    }, 0);
};

export const cartsSlice = createSlice({
  name: 'carts',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const newItem = { ...action.payload, selected: true };
      state.items.push(newItem);
      state.total = calculateTotal(state.items);
    },
    removeCartItem: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((_, index) => index !== action.payload);
      state.total = calculateTotal(state.items);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ index: number; quantity: number }>
    ) => {
      const { index, quantity } = action.payload;
      if (state.items[index]) {
        state.items[index].quantity = Math.max(1, quantity);
        state.total = calculateTotal(state.items);
      }
    },
    toggleItemSelection: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (state.items[index]) {
        state.items[index].selected = !state.items[index].selected;
        state.total = calculateTotal(state.items);
      }
    },
    clearCart: () => initialState
  }
});

export const {
  addToCart,
  removeCartItem,
  updateQuantity,
  toggleItemSelection,
  clearCart
} = cartsSlice.actions;

export default cartsSlice.reducer;
