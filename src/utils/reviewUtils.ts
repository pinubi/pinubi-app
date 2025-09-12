import { PhotoData, PlaceAverageRatings, Review, ReviewType } from '@/types/reviews';

/**
 * Review System Utilities
 * Helper functions for working with reviews
 */

/**
 * Format rating to display with one decimal place
 */
export const formatRating = (rating: number): string => {
  return (Math.round(rating * 10) / 10).toFixed(1);
};

/**
 * Get review type display name in Portuguese
 */
export const getReviewTypeDisplayName = (reviewType: ReviewType): string => {
  const displayNames: Record<ReviewType, string> = {
    food: 'Comida',
    drink: 'Bebida', 
    dessert: 'Sobremesa',
    service: 'Atendimento',
    ambiance: 'Ambiente',
    overall: 'Geral'
  };

  return displayNames[reviewType];
};

/**
 * Get review type emoji
 */
export const getReviewTypeEmoji = (reviewType: ReviewType): string => {
  const emojis: Record<ReviewType, string> = {
    food: '🍽️',
    drink: '🥤',
    dessert: '🍰',
    service: '👥',
    ambiance: '🏪',
    overall: '⭐'
  };

  return emojis[reviewType];
};

/**
 * Get rating color based on score (0-10 scale)
 */
export const getRatingColor = (rating: number): string => {
  if (rating >= 8) return '#4CAF50'; // Green
  if (rating >= 6) return '#FF9800'; // Orange  
  if (rating >= 4) return '#FFC107'; // Yellow
  return '#F44336'; // Red
};

/**
 * Get rating color class for Tailwind CSS
 */
export const getRatingColorClass = (rating: number): string => {
  if (rating >= 8) return 'text-green-500';
  if (rating >= 6) return 'text-orange-500';
  if (rating >= 4) return 'text-yellow-500';
  return 'text-red-500';
};

/**
 * Get rating background color class for Tailwind CSS
 */
export const getRatingBgColorClass = (rating: number): string => {
  if (rating >= 8) return 'bg-green-100';
  if (rating >= 6) return 'bg-orange-100';
  if (rating >= 4) return 'bg-yellow-100';
  return 'bg-red-100';
};

/**
 * Convert 0-10 rating to 5-star scale
 */
export const convertTo5StarScale = (rating: number): number => {
  return Math.round((rating / 10) * 5 * 10) / 10;
};

/**
 * Convert 5-star rating to 0-10 scale
 */
export const convertFrom5StarScale = (rating: number): number => {
  return Math.round((rating / 5) * 10 * 10) / 10;
};

/**
 * Calculate personal average rating from reviews
 */
export const calculatePersonalAverage = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
};

/**
 * Group reviews by type
 */
export const groupReviewsByType = (reviews: Review[]): Record<ReviewType, Review[]> => {
  const grouped: Record<ReviewType, Review[]> = {
    food: [],
    drink: [],
    dessert: [],
    service: [],
    ambiance: [],
    overall: []
  };

  reviews.forEach(review => {
    if (grouped[review.reviewType]) {
      grouped[review.reviewType].push(review);
    }
  });

  return grouped;
};

/**
 * Calculate average rating by type
 */
export const calculateAverageByType = (reviews: Review[]): PlaceAverageRatings => {
  const grouped = groupReviewsByType(reviews);
  
  const averages: PlaceAverageRatings = {
    overall: 0,
    totalReviews: reviews.length
  };

  let overallSum = 0;
  let overallCount = 0;

  Object.entries(grouped).forEach(([type, typeReviews]) => {
    if (typeReviews.length > 0) {
      const sum = typeReviews.reduce((acc, review) => acc + review.rating, 0);
      const average = Math.round((sum / typeReviews.length) * 10) / 10;
      
      (averages as any)[type] = average;
      overallSum += sum;
      overallCount += typeReviews.length;
    }
  });

  if (overallCount > 0) {
    averages.overall = Math.round((overallSum / overallCount) * 10) / 10;
  }

  return averages;
};

/**
 * Get reviews statistics
 */
export const getReviewsStatistics = (reviews: Review[]) => {
  const totalReviews = reviews.length;
  
  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: {},
      categoryBreakdown: {},
      wouldReturnPercentage: 0,
      mostReviewedCategory: null,
      photosCount: 0
    };
  }

  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = Math.round((totalRating / totalReviews) * 10) / 10;

  // Rating distribution (0-10 scale, grouped by integers)
  const ratingDistribution: Record<number, number> = {};
  reviews.forEach(review => {
    const roundedRating = Math.floor(review.rating);
    ratingDistribution[roundedRating] = (ratingDistribution[roundedRating] || 0) + 1;
  });

  // Category breakdown
  const categoryBreakdown: Record<ReviewType, { average: number; count: number }> = {} as any;
  const grouped = groupReviewsByType(reviews);
  
  Object.entries(grouped).forEach(([type, typeReviews]) => {
    if (typeReviews.length > 0) {
      const sum = typeReviews.reduce((acc, review) => acc + review.rating, 0);
      const average = Math.round((sum / typeReviews.length) * 10) / 10;
      
      categoryBreakdown[type as ReviewType] = {
        average,
        count: typeReviews.length
      };
    }
  });

  // Would return percentage
  const wouldReturnCount = reviews.filter(review => review.wouldReturn).length;
  const wouldReturnPercentage = Math.round((wouldReturnCount / totalReviews) * 100);

  // Most reviewed category
  const categoryCounts = Object.values(categoryBreakdown);
  const mostReviewedCategory = categoryCounts.length > 0 
    ? Object.keys(categoryBreakdown).reduce((a, b) => 
        categoryBreakdown[a as ReviewType].count > categoryBreakdown[b as ReviewType].count ? a : b
      )
    : null;

  // Total photos count
  const photosCount = reviews.reduce((count, review) => count + (review.photos?.length || 0), 0);

  return {
    totalReviews,
    averageRating,
    ratingDistribution,
    categoryBreakdown,
    wouldReturnPercentage,
    mostReviewedCategory,
    photosCount
  };
};

/**
 * Filter reviews by criteria
 */
export const filterReviews = (reviews: Review[], filters: {
  reviewType?: ReviewType;
  minRating?: number;
  maxRating?: number;
  wouldReturn?: boolean;
  hasPhotos?: boolean;
  hasComment?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}): Review[] => {
  return reviews.filter(review => {
    // Filter by review type
    if (filters.reviewType && review.reviewType !== filters.reviewType) {
      return false;
    }

    // Filter by rating range
    if (filters.minRating !== undefined && review.rating < filters.minRating) {
      return false;
    }
    if (filters.maxRating !== undefined && review.rating > filters.maxRating) {
      return false;
    }

    // Filter by would return
    if (filters.wouldReturn !== undefined && review.wouldReturn !== filters.wouldReturn) {
      return false;
    }

    // Filter by has photos
    if (filters.hasPhotos !== undefined) {
      const hasPhotos = review.photos && review.photos.length > 0;
      if (filters.hasPhotos !== hasPhotos) {
        return false;
      }
    }

    // Filter by has comment
    if (filters.hasComment !== undefined) {
      const hasComment = review.comment && review.comment.trim().length > 0;
      if (filters.hasComment !== hasComment) {
        return false;
      }
    }

    // Filter by date range
    if (filters.dateRange) {
      const reviewDate = new Date(review.createdAt);
      if (reviewDate < filters.dateRange.start || reviewDate > filters.dateRange.end) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sort reviews by different criteria
 */
export const sortReviews = (reviews: Review[], sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' | 'most_liked'): Review[] => {
  const sorted = [...reviews];

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    case 'highest':
      return sorted.sort((a, b) => b.rating - a.rating);
    
    case 'lowest':
      return sorted.sort((a, b) => a.rating - b.rating);
    
    case 'most_liked':
      return sorted.sort((a, b) => b.likes - a.likes);
    
    default:
      return sorted;
  }
};

/**
 * Validate photo data
 */
export const validatePhotoData = (photo: PhotoData): boolean => {
  return !!(
    photo.url &&
    photo.size > 0 &&
    photo.width > 0 &&
    photo.height > 0
  );
};

/**
 * Get time ago string for review
 */
export const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'agora mesmo';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min atrás`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d atrás`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}sem atrás`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mês atrás`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}ano atrás`;
};

/**
 * Truncate review comment for display
 */
export const truncateComment = (comment: string, maxLength = 100): string => {
  if (comment.length <= maxLength) {
    return comment;
  }
  
  return comment.substring(0, maxLength).trim() + '...';
};

/**
 * Check if user can edit/delete review (basic client-side check)
 */
export const canUserModifyReview = (review: Review, currentUserId: string): boolean => {
  return review.userId === currentUserId;
};

/**
 * Generate review summary text
 */
export const generateReviewSummary = (review: Review): string => {
  const typeDisplay = getReviewTypeDisplayName(review.reviewType);
  const rating = formatRating(review.rating);
  const wouldReturn = review.wouldReturn ? 'voltaria' : 'não voltaria';
  
  return `${typeDisplay}: ${rating}/10 - ${wouldReturn}`;
};
