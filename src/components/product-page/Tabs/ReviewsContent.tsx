'use client';

import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ReviewCard from '@/components/common/ReviewCard';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { Loader2, Star, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// import { Rating } from 'react-simple-star-rating';

import Rating from '@/components/ui/Rating';

// Update interface to match the database structure
interface Review {
  id: string;
  created_at: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  status: string;
}

interface ReviewWithUser extends Review {
  user_details: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

interface ReviewCardData {
  id: number;
  user: string;
  rating: number;
  comment?: string;
  date: string;
  images: string[];
}

interface ReviewsContentProps {
  productId: string;
}

const ReviewsContent = ({ productId }: ReviewsContentProps) => {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const supabase = createClientComponentClient();
  const perPage = 6;
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCanReview, setUserCanReview] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);

  const fetchReviews = async (reset = false) => {
    try {
      if (!productId) {
        console.error('Product ID is undefined');
        return;
      }

      setLoading(true);

      // First fetch reviews
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'published');

      // Add sorting
      switch (sortBy) {
        case 'latest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'most-relevant':
          query = query.order('rating', { ascending: false });
          break;
      }

      // Add pagination
      const currentPage = reset ? 1 : page;
      query = query.range(
        (currentPage - 1) * perPage,
        currentPage * perPage - 1
      );

      const { data: reviewsData, error: reviewsError } = await query;

      if (reviewsError) throw reviewsError;

      // Get total count of published reviews
      const { count: totalCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)
        .eq('status', 'published');

      // Calculate average rating
      const { data: ratingData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('status', 'published');

      if (ratingData && ratingData.length > 0) {
        const sum = ratingData.reduce((acc, curr) => acc + curr.rating, 0);
        setAverageRating(parseFloat((sum / ratingData.length).toFixed(1)));
      }

      // Fetch user details for each review
      const reviewsWithUserDetails = await Promise.all(
        reviewsData.map(async (review: Review) => {
          const { data: userDetails } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, email')
            .eq('id', review.user_id)
            .single();

          return {
            ...review,
            user_details: userDetails
          };
        })
      );

      setTotalReviews(totalCount || 0);
      setHasMore(reviewsWithUserDetails.length === perPage);

      if (reset) {
        setReviews(reviewsWithUserDetails);
        setPage(1);
      } else {
        setReviews(prev => [...prev, ...reviewsWithUserDetails]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const checkUserCanReview = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      if (!session) return;

      // Check if user has purchased and received this product
      const { data: orders } = await supabase
        .from('orders')
        .select('items, status')
        .eq('user_id', session.user.id);

      if (!orders || orders.length === 0) {
        setPurchaseStatus('not_purchased');
        return;
      }

      // Check if product_id is in the items array
      const purchasedItems = orders.some(order =>
        order.items.some(item => item.product_id === parseInt(productId))
      );

      if (!purchasedItems) {
        setPurchaseStatus('not_purchased');
        return;
      }

      // Check if any order is delivered
      const deliveredItems = orders.filter(order =>
        order.items.some(
          item =>
            item.product_id === parseInt(productId) &&
            order.status === 'delivered'
        )
      );

      if (deliveredItems.length === 0) {
        setPurchaseStatus('not_delivered');
        return;
      }

      // Check if user already reviewed this product
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', session.user.id)
        .single();

      if (existingReview) {
        setPurchaseStatus('already_reviewed');
        return;
      }

      // User can review
      setPurchaseStatus('can_review');
      setUserCanReview(true);
    } catch (error) {
      console.error('Error checking if user can review:', error);
    }
  };

  useEffect(() => {
    fetchReviews(true);
    checkUserCanReview();
  }, [productId, sortBy]);

  const handleSortChange = (value: string) => {
    setSortBy(value);
    fetchReviews(true);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchReviews();
  };

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('reviews').insert({
        user_id: supabase.auth.user()?.id,
        product_id: productId,
        rating: newReview.rating,
        comment: newReview.comment,
        status: 'published'
      });

      if (error) throw error;

      toast.success('Review submitted successfully');
      setShowReviewDialog(false);
      fetchReviews(true);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = () => {
    return (
      <Rating
        initialValue={newReview.rating}
        allowFraction
        SVGclassName="inline-block"
        size={30}
        transition
        fillColor="orange"
        emptyColor="gray"
        className="flex"
      />
    );
  };

  const getReviewButtonMessage = () => {
    if (!isLoggedIn) return 'Log in to Write a Review';

    switch (purchaseStatus) {
      case 'not_purchased':
        return 'Purchase This Product to Review';
      case 'not_delivered':
        return 'Can Review After Delivery';
      case 'already_reviewed':
        return "You've Already Reviewed This Product";
      case 'can_review':
        return 'Write a Review';
      default:
        return 'Write a Review';
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between flex-col sm:flex-row mb-5 sm:mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <h3 className="text-xl sm:text-2xl font-bold text-black mr-2">
            All Reviews
          </h3>
          <span className="text-sm sm:text-base text-black/60">
            ({totalReviews})
          </span>
          {averageRating > 0 && (
            <Rating
              initialValue={averageRating}
              allowFraction
              SVGclassName="inline-block"
              size={20}
              fillColor="orange"
              emptyColor="gray"
              className="flex"
            />
          )}
        </div>
        <div className="flex items-center space-x-2.5">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="min-w-[120px] font-medium text-xs sm:text-base px-4 py-3 sm:px-5 sm:py-4 text-black bg-[#F0F0F0] border-none rounded-full h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="most-relevant">Highest Rating</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
            <DialogTrigger asChild>
              <Button
                type="button"
                disabled={!userCanReview}
                title={!userCanReview ? getReviewButtonMessage() : ''}>
                {getReviewButtonMessage()}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
                <DialogDescription>
                  Share your thoughts about this product
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="rating">Rating</Label>
                  <StarRating />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="comment">Your Review</Label>
                  <Textarea
                    id="comment"
                    value={newReview.comment}
                    onChange={e =>
                      setNewReview(prev => ({
                        ...prev,
                        comment: e.target.value
                      }))
                    }
                    placeholder="Share your experience with this product..."
                    className="h-32"
                  />
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting}
                  className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!isLoggedIn && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Want to leave a review?</AlertTitle>
          <AlertDescription>
            Please log in and purchase this product to share your experience.
          </AlertDescription>
        </Alert>
      )}

      {loading && page === 1 ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5 sm:mb-9">
            {reviews.map(review => (
              <ReviewCard
                key={review.id}
                data={{
                  id: parseInt(review.id),
                  user: review.user_details?.full_name || 'Anonymous',
                  rating: review.rating,
                  comment: review.comment || undefined,
                  date: review.created_at,
                  images: []
                }}
                isAction
                isDate
              />
            ))}
          </div>

          {hasMore && (
            <div className="w-full px-4 sm:px-0 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
                className="inline-block w-[230px] px-11 py-4 rounded-full hover:bg-black hover:text-white text-black transition-all font-medium text-sm sm:text-base border-black/10">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Reviews'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default ReviewsContent;
