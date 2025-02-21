export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: number;
          title: string;
          srcUrl: string;
          gallery: string[];
          price: number;
          discount: {
            amount: number;
            percentage: number;
          };
          rating: number;
          category: string;
          created_at: string;
          sales_count: number;
        };
        Insert: Omit<
          Database['public']['Tables']['products']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['products']['Row']>;
      };
    };
  };
}
