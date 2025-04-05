import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DeliveryAddress {
  address: string;
  lat: number;
  lng: number;
}

interface CheckoutState {
  deliveryAddress: DeliveryAddress | null;
  shippingFee: number;
}

const initialState: CheckoutState = {
  deliveryAddress: null,
  shippingFee: 0
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setDeliveryAddress: (state, action: PayloadAction<DeliveryAddress>) => {
      state.deliveryAddress = action.payload;
    },
    setShippingFee: (state, action: PayloadAction<number>) => {
      state.shippingFee = action.payload;
    }
  }
});

export const { setDeliveryAddress, setShippingFee } = checkoutSlice.actions;
export default checkoutSlice.reducer;
