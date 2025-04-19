import React from 'react';
import ProductDetails from './ProductDetails';

const ProductDetailsContent = ({ productId }: { productId: string }) => {
  return (
    <section>
      {/* <h3 className="text-xl sm:text-2xl font-bold text-black mb-5 sm:mb-6">
        Product Details
      </h3> */}
      <ProductDetails productId={productId} />
    </section>
  );
};

export default ProductDetailsContent;
