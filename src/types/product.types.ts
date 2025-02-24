export type Discount = {
  amount: number;
  percentage: number;
};

export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  srcUrl: string;
  discount: {
    percentage: number;
    amount: number;
  };
  attributes: string[];
}
