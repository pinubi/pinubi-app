import { reviewService } from '@/services/reviewService';
import {
  CreateReviewRequest,
  GetPlaceReviewsRequest,
  GetUserReviewsRequest,
  Review,
  ReviewType,
  UpdateReviewRequest
} from '@/types/reviews';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for managing place reviews
 */
export const usePlaceReviews = (placeId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchReviews = useCallback(async (
    params: Partial<GetPlaceReviewsRequest> = {},
    append = false
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await reviewService.getPlaceReviews({
        placeId,
        limit: 20,
        offset: append ? reviews.length : 0,
        ...params
      });

      if (response.success) {
        setReviews(prev => append ? [...prev, ...response.reviews] : response.reviews);
        setHasMore(response.hasMore);
        setTotal(response.total);
      } else {
        setError(response.error || 'Erro ao carregar avaliações');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  }, [placeId, reviews.length]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchReviews({}, true);
    }
  }, [fetchReviews, loading, hasMore]);

  const refreshReviews = useCallback(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (placeId) {
      fetchReviews();
    }
  }, [placeId]);

  return {
    reviews,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refreshReviews,
    fetchReviews
  };
};

/**
 * Hook for managing user reviews
 */
export const useUserReviews = (userId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchReviews = useCallback(async (
    params: Partial<GetUserReviewsRequest> = {},
    append = false
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await reviewService.getUserReviews({
        userId,
        limit: 20,
        offset: append ? reviews.length : 0,
        ...params
      });

      if (response.success) {
        setReviews(prev => append ? [...prev, ...response.reviews] : response.reviews);
        setHasMore(response.hasMore);
        setTotal(response.total);
      } else {
        setError(response.error || 'Erro ao carregar avaliações');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  }, [userId, reviews.length]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchReviews({}, true);
    }
  }, [fetchReviews, loading, hasMore]);

  const refreshReviews = useCallback(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (userId) {
      fetchReviews();
    }
  }, [userId]);

  return {
    reviews,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refreshReviews,
    fetchReviews
  };
};

/**
 * Hook for managing review creation
 */
export const useCreateReview = () => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = useCallback(async (reviewData: CreateReviewRequest) => {
    setCreating(true);
    setError(null);

    try {
      // Validate data first
      const validation = reviewService.validateReviewData(reviewData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return { success: false, error: validation.errors.join(', ') };
      }

      const response = await reviewService.createReview(reviewData);
      
      if (!response.success) {
        setError(response.error || 'Erro ao criar avaliação');
      }

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar avaliação';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setCreating(false);
    }
  }, []);

  return {
    createReview,
    creating,
    error,
    clearError: () => setError(null)
  };
};

/**
 * Hook for managing review updates
 */
export const useUpdateReview = () => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateReview = useCallback(async (updateData: UpdateReviewRequest) => {
    setUpdating(true);
    setError(null);

    try {
      const response = await reviewService.updateReview(updateData);
      
      if (!response.success) {
        setError(response.error || 'Erro ao atualizar avaliação');
      }

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar avaliação';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    updateReview,
    updating,
    error,
    clearError: () => setError(null)
  };
};

/**
 * Hook for managing review deletion
 */
export const useDeleteReview = () => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteReview = useCallback(async (reviewId: string) => {
    setDeleting(true);
    setError(null);

    try {
      const response = await reviewService.deleteReview(reviewId);
      
      if (!response.success) {
        setError(response.error || 'Erro ao deletar avaliação');
      }

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao deletar avaliação';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setDeleting(false);
    }
  }, []);

  return {
    deleteReview,
    deleting,
    error,
    clearError: () => setError(null)
  };
};

/**
 * Hook for managing review likes
 */
export const useReviewLike = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLike = useCallback(async (reviewId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await reviewService.toggleReviewLike(reviewId);
      
      if (!response.success) {
        setError(response.error || 'Erro ao curtir avaliação');
      }

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao curtir avaliação';
      setError(errorMessage);
      return { success: false, error: errorMessage, liked: false };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    toggleLike,
    loading,
    error,
    clearError: () => setError(null)
  };
};

/**
 * Hook for checking user's reviews for a specific place
 */
export const useUserPlaceReviews = (userId: string, placeId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPlaceReviews = useCallback(async () => {
    if (!userId || !placeId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await reviewService.getUserPlaceReviews(userId, placeId);
      
      if (response.success) {
        setReviews(response.reviews);
      } else {
        setError(response.error || 'Erro ao carregar avaliações');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  }, [userId, placeId]);

  const hasReviewForType = useCallback((reviewType: ReviewType): boolean => {
    return reviews.some(review => review.reviewType === reviewType);
  }, [reviews]);

  const getReviewForType = useCallback((reviewType: ReviewType): Review | undefined => {
    return reviews.find(review => review.reviewType === reviewType);
  }, [reviews]);

  const getPersonalAverage = useCallback((): number => {
    return reviewService.calculatePersonalAverage(reviews);
  }, [reviews]);

  useEffect(() => {
    fetchUserPlaceReviews();
  }, [fetchUserPlaceReviews]);

  return {
    reviews,
    loading,
    error,
    hasReviewForType,
    getReviewForType,
    getPersonalAverage,
    refreshReviews: fetchUserPlaceReviews
  };
};

/**
 * Hook for managing reviews grouped by type
 */
export const usePlaceReviewsByType = (placeId: string) => {
  const [reviewsByType, setReviewsByType] = useState<{ [key: string]: Review[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviewsByType = useCallback(async () => {
    if (!placeId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await reviewService.getPlaceReviewsByType(placeId);
      
      if (response.success) {
        setReviewsByType(response.reviewsByType);
      } else {
        setError(response.error || 'Erro ao carregar avaliações');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  const getReviewsForType = useCallback((reviewType: ReviewType): Review[] => {
    return reviewsByType[reviewType] || [];
  }, [reviewsByType]);

  const getAverageForType = useCallback((reviewType: ReviewType): number => {
    const typeReviews = getReviewsForType(reviewType);
    if (typeReviews.length === 0) return 0;
    
    const total = typeReviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / typeReviews.length) * 10) / 10;
  }, [getReviewsForType]);

  useEffect(() => {
    fetchReviewsByType();
  }, [fetchReviewsByType]);

  return {
    reviewsByType,
    loading,
    error,
    getReviewsForType,
    getAverageForType,
    refreshReviews: fetchReviewsByType
  };
};
