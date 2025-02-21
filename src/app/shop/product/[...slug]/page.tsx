import ProductListSec from '@/components/common/ProductListSec';
import BreadcrumbProduct from '@/components/product-page/BreadcrumbProduct';
import Header from '@/components/product-page/Header';
import Tabs from '@/components/product-page/Tabs';
import { productService } from '@/lib/services/productService';
import { notFound } from 'next/navigation';

export default async function ProductPage({
  params
}: {
  params: { slug: string[] };
}) {
  console.log({ params });
  try {
    // Fetch the specific product
    const productData = await productService.getProduct(params.slug[0]);

    // Fetch related products
    const relatedProducts = await productService.getProductsByCategory(
      productData?.category || ''
    );

    if (!productData?.title) {
      notFound();
    }

    return (
      <main>
        <div className="max-w-frame mx-auto px-4 xl:px-0">
          <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
          <BreadcrumbProduct title={productData?.title ?? 'product'} />
          <section className="mb-11">
            <Header data={productData} />
          </section>
          <Tabs />
        </div>
        <div className="mb-[50px] sm:mb-20">
          <ProductListSec
            title="You might also like"
            data={relatedProducts
              .filter(p => p.id !== productData.id)
              .slice(0, 4)}
          />
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error fetching product:', error);
    notFound();
  }
}
