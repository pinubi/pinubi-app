import { functions } from '@/config/firebase';
import {
  CreateReviewRequest,
  CreateReviewResponse,
  DeleteReviewRequest,
  DeleteReviewResponse,
  GetPlaceReviewsRequest,
  GetPlaceReviewsResponse,
  GetUserReviewsRequest,
  GetUserReviewsResponse,
  Review,
  ReviewData,
  ToggleReviewLikeRequest,
  ToggleReviewLikeResponse,
  UpdateReviewRequest,
  UpdateReviewResponse
} from '@/types/reviews';
import { httpsCallable } from 'firebase/functions';

/**
 * Review Service
 * Handles all review-related operations with Firebase Cloud Functions
 * Based on the review-functions.md implementation
 */
class ReviewService {
  private functions;

  constructor() {
    this.functions = functions;
  }

  /**
   * Create a new review for a place
   */
  async createReview(reviewData: CreateReviewRequest): Promise<CreateReviewResponse> {
    try {
      const createReview = httpsCallable<CreateReviewRequest, CreateReviewResponse>(
        this.functions, 
        'createReview'
      );
      
      const result = await createReview(reviewData);      
      return result.data;
    } catch (error: any) {
      console.error('Error creating review:', error);
      return {
        success: false,
        message: 'Erro ao criar avaliação',
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Update an existing review
   */
  async updateReview(updateData: UpdateReviewRequest): Promise<UpdateReviewResponse> {
    try {
      const updateReview = httpsCallable<UpdateReviewRequest, UpdateReviewResponse>(
        this.functions, 
        'updateReview'
      );
      
      const result = await updateReview(updateData);
      return result.data;
    } catch (error: any) {
      console.error('Error updating review:', error);
      return {
        success: false,
        message: 'Erro ao atualizar avaliação',
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<DeleteReviewResponse> {
    try {
      const deleteReview = httpsCallable<DeleteReviewRequest, DeleteReviewResponse>(
        this.functions, 
        'deleteReview'
      );
      
      const result = await deleteReview({ reviewId });
      return result.data;
    } catch (error: any) {
      console.error('Error deleting review:', error);
      return {
        success: false,
        message: 'Erro ao deletar avaliação',
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Get reviews for a specific place
   */
  async getPlaceReviews(params: GetPlaceReviewsRequest): Promise<GetPlaceReviewsResponse> {
    try {
      const getPlaceReviews = httpsCallable<GetPlaceReviewsRequest, GetPlaceReviewsResponse>(
        this.functions, 
        'getPlaceReviews'
      );
      
      const result = await getPlaceReviews(params);
      return result.data;
    } catch (error: any) {
      console.error('Error fetching place reviews:', error);
      return {
        success: false,
        reviews: [],
        total: 0,
        hasMore: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Get reviews by a specific user
   */
  async getUserReviews(params: GetUserReviewsRequest): Promise<GetUserReviewsResponse> {
    try {
      console.log('� ReviewService.getUserReviews - Starting with params:', params);
      console.log('🔧 Firebase functions object:', this.functions);
      
      const getUserReviews = httpsCallable<GetUserReviewsRequest, GetUserReviewsResponse>(
        this.functions, 
        'getUserReviews'
      );
      
      console.log('🔧 Cloud function callable created, making call...');
      const result = await getUserReviews(params);
      
      console.log('� Raw function result:', result);
      console.log('� Function result data:', result.data);
      
      return result.data;
    } catch (error: any) {
      console.error('❌ Error fetching user reviews - Full error object:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error stack:', error.stack);
      
      // Check for specific Firebase function errors
      if (error.code === 'functions/not-found') {
        console.error('❌ Function not found - getUserReviews function does not exist');
      } else if (error.code === 'functions/unauthenticated') {
        console.error('❌ Authentication error - user not authenticated');
      } else if (error.code === 'functions/permission-denied') {
        console.error('❌ Permission denied - user does not have permission');
      } else if (error.code === 'functions/internal') {
        console.error('❌ Internal function error - check function logs');
      }
      
      return {
        success: false,
        data: {
          reviews: [],
          pagination: {
            total: 0,
            hasMore: false,
            limit: params.limit || 20,
            offset: params.offset || 0,
          },
          filters: {
            applied: {
              reviewType: params.reviewType,
              minRating: params.minRating,
              maxRating: params.maxRating,
              startDate: params.startDate,
              endDate: params.endDate,
            },
          },
        },
        // Backward compatibility
        reviews: [],
        total: 0,
        hasMore: false,
        pagination: {
          total: 0,
          hasMore: false,
          limit: params.limit || 20,
          offset: params.offset || 0,
        },
        filters: {
          applied: {
            reviewType: params.reviewType,
            minRating: params.minRating,
            maxRating: params.maxRating,
            startDate: params.startDate,
            endDate: params.endDate,
          },
        },
        error: `${error.code || 'unknown'}: ${error.message || 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Toggle like/unlike on a review
   */
  async toggleReviewLike(reviewId: string): Promise<ToggleReviewLikeResponse> {
    try {
      const toggleReviewLike = httpsCallable<ToggleReviewLikeRequest, ToggleReviewLikeResponse>(
        this.functions, 
        'toggleReviewLike'
      );
      
      const result = await toggleReviewLike({ reviewId });
      return result.data;
    } catch (error: any) {
      console.error('Error toggling review like:', error);
      return {
        success: false,
        liked: false,
        message: 'Erro ao curtir avaliação',
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  // Helper Methods

  /**
   * Get all reviews for a place, grouped by type
   */
  async getPlaceReviewsByType(placeId: string): Promise<{
    success: boolean;
    reviewsByType: { [key: string]: Review[] };
    error?: string;
  }> {
    try {
      const response = await this.getPlaceReviews({ placeId, limit: 100 });
      
      if (!response.success) {
        return {
          success: false,
          reviewsByType: {},
          error: response.error
        };
      }

      const reviewsByType: { [key: string]: Review[] } = {};
      
      response.reviews.forEach(review => {
        if (!reviewsByType[review.reviewType]) {
          reviewsByType[review.reviewType] = [];
        }
        reviewsByType[review.reviewType].push(review);
      });

      return {
        success: true,
        reviewsByType
      };
    } catch (error: any) {
      return {
        success: false,
        reviewsByType: {},
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Get user's reviews for a specific place
   */
  async getUserPlaceReviews(userId: string, placeId: string): Promise<{
    success: boolean;
    reviews: Review[];
    error?: string;
  }> {
    try {
      const response = await this.getPlaceReviews({ 
        placeId, 
        userId, 
        limit: 50 
      });
      
      return {
        success: response.success,
        reviews: response.reviews,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        reviews: [],
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Check if user has already reviewed a place in a specific category
   */
  async hasUserReviewedCategory(
    userId: string, 
    placeId: string, 
    reviewType: string
  ): Promise<boolean> {
    try {
      const response = await this.getPlaceReviews({ 
        placeId, 
        userId, 
        reviewType: reviewType as any 
      });
      
      return response.success && response.reviews.length > 0;
    } catch (error) {
      console.error('Error checking user review category:', error);
      return false;
    }
  }

  /**
   * Validate review data before submission
   */
  validateReviewData(reviewData: Partial<ReviewData>): { 
    isValid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];

    if (!reviewData.placeId) {
      errors.push('ID do lugar é obrigatório');
    }

    if (!reviewData.rating || reviewData.rating < 0 || reviewData.rating > 10) {
      errors.push('Nota deve ser entre 0 e 10');
    }

    if (!reviewData.reviewType) {
      errors.push('Tipo de avaliação é obrigatório');
    }

    const validTypes = ['food', 'drink', 'dessert', 'service', 'ambiance', 'overall'];
    if (reviewData.reviewType && !validTypes.includes(reviewData.reviewType)) {
      errors.push('Tipo de avaliação inválido');
    }

    if (reviewData.wouldReturn === undefined || reviewData.wouldReturn === null) {
      errors.push('Campo "voltaria" é obrigatório');
    }

    if (reviewData.isVisited === undefined || reviewData.isVisited === null) {
      errors.push('Campo "visitado" é obrigatório');
    }

    if (reviewData.comment && reviewData.comment.length > 1000) {
      errors.push('Comentário deve ter no máximo 1000 caracteres');
    }

    if (reviewData.photos && reviewData.photos.length > 5) {
      errors.push('Máximo de 5 fotos por avaliação');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format rating for display (1 decimal place)
   */
  formatRating(rating: number): string {
    return (Math.round(rating * 10) / 10).toFixed(1);
  }

  /**
   * Get review type display name in Portuguese
   */
  getReviewTypeDisplayName(reviewType: string): string {
    const displayNames: { [key: string]: string } = {
      food: 'Comida',
      drink: 'Bebida',
      dessert: 'Sobremesa',
      service: 'Atendimento',
      ambiance: 'Ambiente',
      overall: 'Geral'
    };

    return displayNames[reviewType] || reviewType;
  }

  /**
   * Calculate personal average for a user at a place
   */
  calculatePersonalAverage(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }

  /**
   * Get rating color based on score (0-10 scale)
   */
  getRatingColor(rating: number): string {
    if (rating >= 8) return '#4CAF50'; // Green
    if (rating >= 6) return '#FF9800'; // Orange
    if (rating >= 4) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  }

  /**
   * Convert 0-10 rating to 5-star scale
   */
  convertTo5StarScale(rating: number): number {
    return Math.round((rating / 10) * 5 * 10) / 10;
  }

  /**
   * Convert 5-star rating to 0-10 scale
   */
  convertFrom5StarScale(rating: number): number {
    return Math.round((rating / 5) * 10 * 10) / 10;
  }

  // Check-in specific methods

  /**
   * Create a check-in review (always isVisited = true)
   */
  async createCheckInReview(reviewData: Omit<CreateReviewRequest, 'isVisited'>): Promise<CreateReviewResponse> {
    return this.createReview({
      ...reviewData,
      isVisited: true // Check-ins are always visits
    });
  }

  /**
   * Get all check-ins (visited reviews) for a place
   */
  async getPlaceCheckIns(placeId: string, userId?: string): Promise<{
    success: boolean;
    checkIns: Review[];
    error?: string;
  }> {
    try {
      const response = await this.getPlaceReviews({ 
        placeId, 
        userId,
        limit: 100 
      });
      
      if (!response.success) {
        return {
          success: false,
          checkIns: [],
          error: response.error
        };
      }

      // Filter only visited reviews (check-ins)
      const checkIns = response.reviews.filter(review => review.isVisited);

      return {
        success: true,
        checkIns
      };
    } catch (error: any) {
      return {
        success: false,
        checkIns: [],
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Get user's check-ins across all places
   */
  async getUserCheckIns(userId: string): Promise<{
    success: boolean;
    checkIns: Review[];
    error?: string;
  }> {
    try {
      const response = await this.getUserReviews({ userId, limit: 100 });
      
      if (!response.success) {
        return {
          success: false,
          checkIns: [],
          error: response.error
        };
      }

      // Filter only visited reviews (check-ins)
      const reviews = response.data?.reviews || response.reviews || [];
      const checkIns = reviews.filter(review => review.isVisited);

      return {
        success: true,
        checkIns
      };
    } catch (error: any) {
      return {
        success: false,
        checkIns: [],
        error: error.message || 'Erro desconhecido'
      };
    }
  }
}

export const reviewService = new ReviewService();
