import ProductListSec from '@/components/common/ProductListSec';
import Brands from '@/components/homepage/Brands';
import DressStyle from '@/components/homepage/DressStyle';
import Header from '@/components/homepage/Header';
import Reviews from '@/components/homepage/Reviews';
import { Review } from '@/types/review.types';
import { productService } from '@/lib/services/productService';

// Keep reviews data for now since it's not in the database yet
export const reviewsData: Review[] = [
  {
    id: 1,
    user: 'Alex K.',
    content:
      '"Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co. The range of options they offer is truly remarkable, catering to a variety of tastes and occasions."',
    rating: 5,
    date: 'August 14, 2023'
  },
  {
    id: 2,
    user: 'Sarah M.',
    content: `"I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I've bought has exceeded my expectations.”`,
    rating: 5,
    date: 'August 15, 2023'
  },
  {
    id: 3,
    user: 'Ethan R.',
    content: `"This t-shirt is a must-have for anyone who appreciates good design. The minimalistic yet stylish pattern caught my eye, and the fit is perfect. I can see the designer's touch in every aspect of this shirt."`,
    rating: 5,
    date: 'August 16, 2023'
  },
  {
    id: 4,
    user: 'Olivia P.',
    content: `"As a UI/UX enthusiast, I value simplicity and functionality. This t-shirt not only represents those principles but also feels great to wear. It's evident that the designer poured their creativity into making this t-shirt stand out."`,
    rating: 5,
    date: 'August 17, 2023'
  },
  {
    id: 5,
    user: 'Liam K.',
    content: `"This t-shirt is a fusion of comfort and creativity. The fabric is soft, and the design speaks volumes about the designer's skill. It's like wearing a piece of art that reflects my passion for both design and fashion."`,
    rating: 5,
    date: 'August 18, 2023'
  },
  {
    id: 6,
    user: 'Samantha D.',
    content: `"I absolutely love this t-shirt! The design is unique and the fabric feels so comfortable. As a fellow designer, I appreciate the attention to detail. It's become my favorite go-to shirt."`,
    rating: 5,
    date: 'August 19, 2023'
  }
];

export default async function Home() {
  try {
    // Fetch products from the API
    const newArrivals = await productService.getNewArrivals();
    const topSelling = await productService.getTopSelling();

    console.log({ newArrivals });
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
        </main>
      </>
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return <div>Error loading products. Please try again later.</div>;
  }
}
