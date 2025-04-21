import ProductListSec from '@/components/common/ProductListSec';
import Brands from '@/components/homepage/Brands';
import DressStyle from '@/components/homepage/DressStyle';
import Header from '@/components/homepage/Header';
import Reviews from '@/components/homepage/Reviews';
import { Review } from '@/types/review.types';
import { productService } from '@/lib/services/productService';
import ShippingSection from '@/components/home/ShippingSection';
import Image from 'next/image';
import { FIRST_DISTRICT_MUNICIPALITIES } from '@/lib/utils/shipping';

// Keep reviews data for now since it's not in the database yet
const reviewsData: Review[] = [];

const firstDistrictMunicipalities = [
  'Cabusao',
  'Del Gallego',
  'Lupi',
  'Ragay',
  'Sipocot'
];

export default async function Home() {
  try {
    // Fetch products from the API
    const newArrivals = await productService.getNewArrivals();
    const topSelling = await productService.getTopSelling();

    //console.log({ newArrivals });
    return (
      <>
        <Header />
        <Brands />
        <main className="my-[50px] sm:my-[72px]">
          <ProductListSec
            title="NEW PRODUCTS"
            data={newArrivals}
            viewAllLink="/shop#new-arrivals"
          />
          <div className="max-w-frame mx-auto px-4 xl:px-0">
            <hr className="h-[1px] border-t-black/10 my-10 sm:my-16" />
          </div>
          <div className="mb-[50px] sm:mb-20">
            <ProductListSec
              title="TOP SELLING"
              data={topSelling}
              viewAllLink="/shop#top-selling"
            />
          </div>
          {/* <div className="mb-[50px] sm:mb-20">
            <DressStyle />
          </div> */}
          {/* <Reviews data={reviewsData} /> */}
          <ShippingSection />
        </main>
      </>
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return <div>Error loading products. Please try again later.</div>;
  }
}
