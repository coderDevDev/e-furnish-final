export type Discount = {
  amount: number;
  percentage: number;
};

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  srcurl: string;
  gallery: string[];
  rating: number | null;
  sales_count: number;
  created_at: string;
  updated_at: string;
}
