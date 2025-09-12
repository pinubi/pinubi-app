import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { reviewService } from '@/services/reviewService';
import type { CheckIn, CheckInFormData, CheckInState } from '@/types/checkins';
import type { CreateReviewRequest, PhotoData, ReviewType } from '@/types/reviews';

interface CheckInsStoreState {
  // Data
  checkIns: CheckIn[];
  userCheckIns: Record<string, CheckIn[]>; // placeId -> CheckIn[]
  userReviewTypes: Record<string, ReviewType[]>; // placeId -> ReviewType[]
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Current check-in flow state
  currentCheckIn: CheckInState;
}

interface CheckInsStore extends CheckInsStoreState {
  // Check-in Management (now integrates with review service)
  createCheckIn: (placeId: string, data: CheckInFormData) => Promise<void>;
  updateCheckIn: (checkInId: string, data: Partial<CheckInFormData>) => Promise<void>;
  deleteCheckIn: (checkInId: string) => Promise<void>;
  
  // Data Retrieval
  getUserCheckIns: (placeId: string) => CheckIn[];
  getUserReviewTypes: (placeId: string) => ReviewType[];
  getAllUserCheckIns: () => Promise<void>;
  getCheckInById: (checkInId: string) => CheckIn | null;
  
  // Check-in Flow State
  startCheckIn: (placeId: string, initialType?: ReviewType) => void;
  updateCheckInStep: (step: number) => void;
  updateFormData: (data: Partial<CheckInFormData>) => void;
  completeCheckIn: () => void;
  cancelCheckIn: () => void;
  resetCheckInFlow: () => void;
  
  // Review Type Management
  loadUserReviewTypes: (placeId: string, userId: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const initialCheckInState: CheckInState = {
  currentStep: 1,
  totalSteps: 5, // Updated to include review type selection
  formData: {
    visitDate: new Date(),
    rating: 8.0,
    reviewType: 'overall',
    description: '',
    wouldReturn: null,
    photos: [],
  },
  isValid: false,
};

export const useCheckInsStore = create<CheckInsStore>()(
  persist(
    (set, get) => ({
      // Initial State
      checkIns: [],
      userCheckIns: {},
      userReviewTypes: {},
      loading: false,
      error: null,
      currentCheckIn: initialCheckInState,

      // Check-in Management (now integrates with review service)
      createCheckIn: async (placeId: string, data: CheckInFormData) => {
        try {
          set({ loading: true, error: null });

          // Convert photos to PhotoData format
          const photos: PhotoData[] = data.photos.map((url, index) => ({
            url,
            size: 0, // Will be set by backend
            width: 0, // Will be set by backend
            height: 0, // Will be set by backend
          }));

          // Create review using the review service
          const reviewRequest: CreateReviewRequest = {
            placeId,
            rating: data.rating,
            reviewType: data.reviewType,
            wouldReturn: data.wouldReturn ?? false,
            comment: data.description,
            photos,
            isVisited: true,
            visitDate: data.visitDate.toISOString(),
          };

          const response = await reviewService.createReview(reviewRequest);

          if (!response.success) {
            throw new Error(response.error || 'Falha ao criar avaliação');
          }

          // Create local CheckIn record for UI consistency
          const checkInId = response.reviewId || `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const newCheckIn: CheckIn = {
            id: checkInId,
            userId: 'current-user', // TODO: Get from auth store
            placeId,
            visitDate: data.visitDate.toISOString(),
            rating: data.rating,
            reviewType: data.reviewType,
            description: data.description || '',
            wouldReturn: data.wouldReturn ?? false,
            photos: data.photos.map((url, index) => ({
              id: `photo_${index}`,
              url,
              order: index,
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Update local state
          set((state) => ({
            checkIns: [...state.checkIns, newCheckIn],
            userCheckIns: {
              ...state.userCheckIns,
              [placeId]: [...(state.userCheckIns[placeId] || []), newCheckIn],
            },
            userReviewTypes: {
              ...state.userReviewTypes,
              [placeId]: [...(state.userReviewTypes[placeId] || []), data.reviewType],
            },
            loading: false,
          }));

          console.log('Check-in/Review created successfully:', newCheckIn);
        } catch (error: any) {
          console.error('Error creating check-in:', error);
          set({ 
            loading: false, 
            error: error.message || 'Falha ao criar check-in. Tente novamente.' 
          });
          throw error;
        }
      },

      updateCheckIn: async (checkInId: string, data: Partial<CheckInFormData>) => {
        try {
          set({ loading: true, error: null });

          // Find the local check-in to get the review ID
          const { checkIns } = get();
          const checkIn = checkIns.find(c => c.id === checkInId);
          
          if (!checkIn) {
            throw new Error('Check-in não encontrado');
          }

          // Update using review service
          const updateRequest = {
            reviewId: checkInId, // Using checkIn ID as review ID
            ...(data.rating !== undefined && { rating: data.rating }),
            ...(data.reviewType !== undefined && { reviewType: data.reviewType }),
            ...(data.wouldReturn !== undefined && data.wouldReturn !== null && { wouldReturn: data.wouldReturn }),
            ...(data.description !== undefined && { comment: data.description }),
            ...(data.visitDate && { visitDate: data.visitDate.toISOString() }),
            ...(data.photos && { 
              photos: data.photos.map(url => ({
                url,
                size: 0,
                width: 0,
                height: 0,
              }))
            }),
          };

          const response = await reviewService.updateReview(updateRequest);

          if (!response.success) {
            throw new Error(response.error || 'Falha ao atualizar avaliação');
          }

          // Update local state
          set((state) => ({
            checkIns: state.checkIns.map((checkIn) =>
              checkIn.id === checkInId
                ? {
                    ...checkIn,
                    ...(data.rating !== undefined && { rating: data.rating }),
                    ...(data.reviewType !== undefined && { reviewType: data.reviewType }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.wouldReturn !== undefined && data.wouldReturn !== null && { wouldReturn: data.wouldReturn }),
                    ...(data.visitDate && { visitDate: data.visitDate.toISOString() }),
                    ...(data.photos && { 
                      photos: data.photos.map((url, index) => ({
                        id: `photo_${index}`,
                        url,
                        order: index,
                      }))
                    }),
                    updatedAt: new Date().toISOString(),
                  }
                : checkIn
            ),
            loading: false,
          }));
        } catch (error: any) {
          console.error('Error updating check-in:', error);
          set({ 
            loading: false, 
            error: error.message || 'Falha ao atualizar check-in. Tente novamente.' 
          });
          throw error;
        }
      },

      deleteCheckIn: async (checkInId: string) => {
        try {
          set({ loading: true, error: null });

          // Delete using review service
          const response = await reviewService.deleteReview(checkInId);

          if (!response.success) {
            throw new Error(response.error || 'Falha ao deletar avaliação');
          }

          // Update local state
          set((state) => {
            const deletedCheckIn = state.checkIns.find(c => c.id === checkInId);
            
            return {
              checkIns: state.checkIns.filter((checkIn) => checkIn.id !== checkInId),
              userCheckIns: Object.fromEntries(
                Object.entries(state.userCheckIns).map(([placeId, checkIns]) => [
                  placeId,
                  checkIns.filter((checkIn) => checkIn.id !== checkInId),
                ])
              ),
              userReviewTypes: deletedCheckIn ? {
                ...state.userReviewTypes,
                [deletedCheckIn.placeId]: (state.userReviewTypes[deletedCheckIn.placeId] || [])
                  .filter(type => type !== deletedCheckIn.reviewType)
              } : state.userReviewTypes,
              loading: false,
            };
          });
        } catch (error: any) {
          console.error('Error deleting check-in:', error);
          set({ 
            loading: false, 
            error: error.message || 'Falha ao excluir check-in. Tente novamente.' 
          });
          throw error;
        }
      },

      // Data Retrieval
      getUserCheckIns: (placeId: string) => {
        const { userCheckIns } = get();
        return userCheckIns[placeId] || [];
      },

      getUserReviewTypes: (placeId: string) => {
        const { userReviewTypes } = get();
        return userReviewTypes[placeId] || [];
      },

      getAllUserCheckIns: async () => {
        try {
          set({ loading: true, error: null });

          // TODO: Implement with actual user ID when auth is ready
          // const userId = 'current-user';
          // const response = await reviewService.getUserReviews({ userId, limit: 100 });
          
          set({ loading: false });
        } catch (error: any) {
          console.error('Error fetching user check-ins:', error);
          set({ 
            loading: false, 
            error: 'Falha ao carregar check-ins. Tente novamente.' 
          });
        }
      },

      getCheckInById: (checkInId: string) => {
        const { checkIns } = get();
        return checkIns.find((checkIn) => checkIn.id === checkInId) || null;
      },

      // Review Type Management
      loadUserReviewTypes: async (placeId: string, userId: string) => {
        try {
          const response = await reviewService.getPlaceReviews({ 
            placeId, 
            userId, 
            limit: 50 
          });

          if (response.success) {
            const reviewTypes = response.reviews.map(review => review.reviewType);
            set((state) => ({
              userReviewTypes: {
                ...state.userReviewTypes,
                [placeId]: reviewTypes,
              },
            }));
          }
        } catch (error) {
          console.error('Error loading user review types:', error);
        }
      },

      // Check-in Flow State
      startCheckIn: (placeId: string, initialType: ReviewType = 'overall') => {
        set({
          currentCheckIn: {
            ...initialCheckInState,
            formData: {
              ...initialCheckInState.formData,
              visitDate: new Date(),
              reviewType: initialType,
            },
          },
        });
      },

      updateCheckInStep: (step: number) => {
        set((state) => ({
          currentCheckIn: {
            ...state.currentCheckIn,
            currentStep: Math.max(1, Math.min(step, state.currentCheckIn.totalSteps)),
          },
        }));
      },

      updateFormData: (data: Partial<CheckInFormData>) => {
        set((state) => ({
          currentCheckIn: {
            ...state.currentCheckIn,
            formData: {
              ...state.currentCheckIn.formData,
              ...data,
            },
            isValid: validateFormData({ ...state.currentCheckIn.formData, ...data }),
          },
        }));
      },

      completeCheckIn: () => {
        set({
          currentCheckIn: initialCheckInState,
        });
      },

      cancelCheckIn: () => {
        set({
          currentCheckIn: initialCheckInState,
        });
      },

      resetCheckInFlow: () => {
        set({
          currentCheckIn: initialCheckInState,
        });
      },

      // Utility
      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },
    }),
    {
      name: 'checkins-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        checkIns: state.checkIns,
        userCheckIns: state.userCheckIns,
        userReviewTypes: state.userReviewTypes,
      }),
    }
  )
);

// Helper function to validate form data
const validateFormData = (data: Partial<CheckInFormData>): boolean => {
  return !!(
    data.visitDate &&
    data.rating !== undefined &&
    data.rating >= 0 &&
    data.rating <= 10 &&
    data.reviewType &&
    data.wouldReturn !== null
  );
};
