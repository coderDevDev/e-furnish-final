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
import { Loader2, Star, StarHalf } from 'lucide-react';

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
  console.log({ productId });
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const [totalReviews, setTotalReviews] = useState(0);
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

      // Fetch user details for each review
      const reviewsWithUserDetails = await Promise.all(
        (reviewsData || []).map(async (review: Review) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, email')
            .eq('id', review.user_id)
            .single();

          return {
            ...review,
            user_details: userData
          } as ReviewWithUser;
        })
      );

      setTotalReviews(totalCount || 0);
      setHasMore((totalCount || 0) > currentPage * perPage);

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

  useEffect(() => {
    if (productId) {
      fetchReviews(true);
    }
  }, [productId, sortBy]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchReviews();
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleSubmitReview = async () => {
    try {
      setIsSubmitting(true);

      // Get current user
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error('Please login to submit a review');
        return;
      }

      // Submit review
      const { error: reviewError } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user.id,
        rating: newReview.rating,
        comment: newReview.comment || null,
        status: 'published'
      });

      if (reviewError) throw reviewError;

      // Reset form and close dialog
      setNewReview({ rating: 5, comment: '' });
      setShowReviewDialog(false);

      // Refresh reviews
      fetchReviews(true);
      toast.success('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
            className={`p-1 ${
              star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'
            }`}>
            <Star className="w-8 h-8" />
          </button>
        ))}
      </div>
    );
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
                className="sm:min-w-[166px] px-4 py-3 sm:px-5 sm:py-4 rounded-full bg-black font-medium text-xs sm:text-base h-12">
                Write a Review
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

      {loading && page === 1 ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
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
