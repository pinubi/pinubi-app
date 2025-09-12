/**
 * Review System Types
 * Based on the review-functions.md documentation
 */

export type ReviewType = 'food' | 'drink' | 'dessert' | 'service' | 'ambiance' | 'overall';

export interface PhotoData {
  url: string;
  thumbnail?: string;
  size: number;
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
}

export interface GetUserReviewsResponse {
  success: boolean;
  reviews: Review[];
  total: number;
  hasMore: boolean;
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
