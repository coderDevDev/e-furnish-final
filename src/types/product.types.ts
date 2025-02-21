export type Discount = {
  amount: number;
  percentage: number;
};

export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  srcurl: string; // Keep lowercase to match database
  gallery: string[]; // Add gallery back to the type
  rating: number;
  salesCount: number;
  createdAt: string;
  discount?: {
    amount: number;
    percentage: number;
  };
  stock: number;
}
