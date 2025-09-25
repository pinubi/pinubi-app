export interface Reviews {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  rating: number;
  reviewType: string;
  comment?: string;
  wouldReturn: boolean;
  isVisited: boolean;
  photos: string[];
  tags: string[];
  visitDate: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}


/**
 * Review System Types
 * Based on the review-functions.md documentation
 */

export type ReviewType = 'food' | 'drink' | 'dessert' | 'service' | 'ambiance' | 'overall';

export interface PhotoData {
  base64: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
}

export interface ReviewData {
  placeId: string;
  rating: number; // 0-10 with decimals
  reviewType: ReviewType;
  wouldReturn: boolean;
  comment?: string;
  photos?: PhotoData[];
  isVisited: boolean;
  visitDate?: string;
}

export interface Review {
  id: string;
  userId: string;
  placeId: string;
  rating: number; // 0-10 with decimals
  reviewType: ReviewType;
  wouldReturn: boolean;
  comment: string;
  photos: PhotoData[];
  isVisited: boolean;
  visitDate?: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaceAverageRatings {
  overall: number;
  food?: number;
  drink?: number;
  dessert?: number;
  service?: number;
  ambiance?: number;
  totalReviews: number;
}

export interface UserPlaceInteraction {
  id: string; // userId_placeId
  userId: string;
  placeId: string;
  isVisited: boolean;
  isWantToVisit: boolean;
  isFavorite: boolean;
  reviews: {
    reviewId: string;
    type: ReviewType;
    rating: number;
  }[];
  personalAverage: number;
  totalReviews: number;
  lastVisit?: string;
  createdAt: string;
  updatedAt: string;
}

// Cloud Function Request/Response Types

export interface CreateReviewRequest {
  placeId: string;
  rating: number;
  reviewType: ReviewType;
  wouldReturn: boolean;
  comment?: string;
  photos?: PhotoData[];
  isVisited: boolean;
  visitDate?: string;
}

export interface CreateReviewResponse {
  success: boolean;
  reviewId?: string;
  message: string;
  error?: string;
}

export interface UpdateReviewRequest {
  reviewId: string;
  rating?: number;
  reviewType?: ReviewType;
  wouldReturn?: boolean;
  comment?: string;
  photos?: PhotoData[];
  isVisited?: boolean;
  visitDate?: string;
}

export interface UpdateReviewResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface DeleteReviewRequest {
  reviewId: string;
}

export interface DeleteReviewResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface GetPlaceReviewsRequest {
  placeId: string;
  limit?: number;
  offset?: number;
  reviewType?: ReviewType;
  userId?: string;
}

export interface GetPlaceReviewsResponse {
  success: boolean;
  reviews: Review[];
  total: number;
  hasMore: boolean;
  error?: string;
}

export interface GetUserReviewsRequest {
  userId: string;
  limit?: number;
  offset?: number;
  reviewType?: ReviewType;
  minRating?: number;
  maxRating?: number;
  startDate?: string;
  endDate?: string;
  groupBy?: 'place' | 'category';
  includePlaceData?: boolean;
  includeStats?: boolean;
}

export interface UserReviewsStatistics {
  totalReviews: number;
  averageRating: number;
  placesVisited: number;
  reviewCountByType: {
    food?: number;
    drink?: number;
    dessert?: number;
    service?: number;
    ambiance?: number;
    overall?: number;
  };
  averagesByType: {
    food?: number;
    drink?: number;
    dessert?: number;
    service?: number;
    ambiance?: number;
    overall?: number;
  };
  recentActivity: {
    last30Days: number;
    averageRatingLast30Days: number;
  };
  distribution: {
    byRating: {
      excellent: number; // >= 8
      good: number; // 6-7.9
      average: number; // 4-5.9
      poor: number; // < 4
    };
  };
}

export interface ReviewPlace {
  id: string;
  name: string;
  address?: string;
  photos: string[];
  mainPhoto?: string;
  category?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ReviewWithPlace extends Review {
  place?: ReviewPlace;
}

export interface GroupedByPlace {
  placeId: string;
  place?: ReviewPlace;
  reviewsCount: number;
  averageRating: number;
  reviews: ReviewWithPlace[];
  lastVisit: string;
}

export interface GroupedByCategory {
  category: ReviewType;
  reviewsCount: number;
  averageRating: number;
  reviews: ReviewWithPlace[];
  lastReview: string;
}

export interface GetUserReviewsResponse {
  success: boolean;
  data?: {
    reviews: ReviewWithPlace[];
    statistics?: UserReviewsStatistics;
    groupedData?: GroupedByPlace[] | GroupedByCategory[];
    pagination: {
      total: number;
      hasMore: boolean;
      limit: number;
      offset: number;
    };
    filters: {
      applied: {
        reviewType?: string;
        minRating?: number;
        maxRating?: number;
        startDate?: string;
        endDate?: string;
      };
    };
  };
  reviews?: ReviewWithPlace[]; // For backward compatibility
  total?: number; // For backward compatibility
  hasMore?: boolean; // For backward compatibility
  statistics?: UserReviewsStatistics; // For backward compatibility
  groupedData?: GroupedByPlace[] | GroupedByCategory[]; // For backward compatibility
  pagination?: {
    total: number;
    hasMore: boolean;
    limit: number;
    offset: number;
  }; // For backward compatibility
  filters?: {
    applied: {
      reviewType?: string;
      minRating?: number;
      maxRating?: number;
      startDate?: string;
      endDate?: string;
    };
  }; // For backward compatibility
  error?: string;
}

export interface ToggleReviewLikeRequest {
  reviewId: string;
}

export interface ToggleReviewLikeResponse {
  success: boolean;
  liked: boolean;
  message: string;
  error?: string;
}

// UI Helper Types

export interface PlaceRatingsDisplay {
  googleRating?: number;
  personalRating?: number;
  friendsRating?: number;
  overallRating?: number;
  averageRatings?: PlaceAverageRatings;
}

export interface ReviewFormData {
  rating: number;
  reviewType: ReviewType;
  wouldReturn: boolean;
  comment: string;
  photos: PhotoData[];
  isVisited: boolean;
  visitDate?: Date;
}

export interface ReviewMetrics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number; // rating -> count
  };
  categoryBreakdown: {
    [key in ReviewType]?: {
      average: number;
      count: number;
    };
  };
}
