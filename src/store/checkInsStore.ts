import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { convertPhotosToPhotoData } from '@/components/checkin/PhotoUploadSection';
import { reviewService } from '@/services/reviewService';
import type { CheckIn, CheckInFormData, CheckInState } from '@/types/checkins';
import type { CreateReviewRequest, PhotoData } from '@/types/reviews';

interface CheckInsStoreState {
  // Data
  checkIns: CheckIn[];
  userCheckIns: Record<string, CheckIn[]>; // placeId -> CheckIn[]

  // UI State
  loading: boolean;
  error: string | null;

  // Current check-in flow state
  currentCheckIn: CheckInState;
}

interface CheckInsStore extends CheckInsStoreState {
  // Check-in Management
  createCheckIn: (placeId: string, data: CheckInFormData) => Promise<void>;
  updateCheckIn: (checkInId: string, data: Partial<CheckInFormData>) => Promise<void>;
  deleteCheckIn: (checkInId: string) => Promise<void>;

  // Data Retrieval
  getUserCheckIns: (placeId: string) => CheckIn[];
  getAllUserCheckIns: () => Promise<void>;
  getCheckInById: (checkInId: string) => CheckIn | null;
  loadPlaceCheckIns: (placeId: string) => Promise<CheckIn[]>;

  // Check-in Flow State
  startCheckIn: (placeId: string) => void;
  updateCheckInStep: (step: number) => void;
  updateFormData: (data: Partial<CheckInFormData>) => void;
  completeCheckIn: () => void;
  cancelCheckIn: () => void;
  resetCheckInFlow: () => void;

  // Utility
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const initialCheckInState: CheckInState = {
  currentStep: 1,
  totalSteps: 4,
  formData: {
    visitDate: new Date(),
    rating: 5.0,
    reviewType: 'overall', // Default to overall review type
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
      loading: false,
      error: null,
      currentCheckIn: initialCheckInState,

      // Check-in Management
      createCheckIn: async (placeId: string, data: CheckInFormData) => {
        try {
          set({ loading: true, error: null });

          console.log('🔍 CreateCheckIn called with data:', data);
          console.log('🔍 Review type:', data.reviewType);
          console.log('🔍 Would return:', data.wouldReturn);
          console.log('🔍 Visit date:', data.visitDate);
          console.log('🔍 Rating:', data.rating);

          // Validate required fields according to ReviewData interface
          const missingFields: string[] = [];

          if (!data.reviewType) missingFields.push('reviewType');
          if (data.wouldReturn === null || data.wouldReturn === undefined) missingFields.push('wouldReturn');
          if (!data.visitDate) missingFields.push('visitDate');
          if (data.rating === undefined || data.rating === null) missingFields.push('rating');
          if (data.rating < 0 || data.rating > 10) missingFields.push('rating (must be 0-10)');

          if (missingFields.length > 0) {
            const error = `Campos obrigatórios ausentes: ${missingFields.join(', ')}`;
            console.error('❌', error);
            throw new Error(error);
          }

          console.log('✅ Validation passed, creating review...');

          // Convert raw photos to PhotoData format for the component
          const convertedPhotos = await convertPhotosToPhotoData(data.photos);

          // The converted photos already match the PhotoData interface
          const photos: PhotoData[] = convertedPhotos;

          const reviewData: CreateReviewRequest = {
            placeId,
            rating: data.rating,
            reviewType: data.reviewType,
            wouldReturn: data.wouldReturn as boolean, // Safe cast since we validated it's not null
            comment: data.description || '', // Optional field
            isVisited: true, // Check-ins are always visits
            visitDate: data.visitDate.toISOString().split('T')[0], // Format as YYYY-MM-DD string
            photos: photos?.length > 0 ? photos : undefined, // Only include photos if there are any
          };

          console.log('📤 Sending review data to Firebase:', reviewData);

          // Create review using the review service (check-in specific method)
          const reviewResponse = await reviewService.createCheckInReview(reviewData);

          if (!reviewResponse.success) {
            throw new Error(reviewResponse.error || 'Falha ao criar avaliação');
          }

          // Generate unique ID for the local check-in
          const checkInId =
            reviewResponse.reviewId || `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const newCheckIn: CheckIn = {
            id: checkInId,
            userId: 'current-user', // TODO: Get from auth store
            placeId,
            visitDate: data.visitDate.toISOString(),
            rating: data.rating,
            reviewType: data.reviewType,
            description: data.description || '',
            wouldReturn: data.wouldReturn as boolean, // Safe cast since we validated it's not null
            photos: photos.map((photo, index) => ({
              id: `photo_${index}`,
              url: photo?.base64 || '', // Assuming base64 is used as URL here; adjust as needed
              thumbnail: undefined, // Could generate a thumbnail if needed
              order: index,
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Add to checkIns array
          set((state) => ({
            checkIns: [...state.checkIns, newCheckIn],
            userCheckIns: {
              ...state.userCheckIns,
              [placeId]: [...(state.userCheckIns[placeId] || []), newCheckIn],
            },
            loading: false,
          }));

          console.log('Check-in created successfully:', newCheckIn);
        } catch (error: any) {
          console.error('Error creating check-in:', error);
          set({
            loading: false,
            error: error.message || 'Falha ao criar check-in. Tente novamente.',
          });
          throw error; // Re-throw so UI can handle it
        }
      },

      updateCheckIn: async (checkInId: string, data: Partial<CheckInFormData>) => {
        try {
          set({ loading: true, error: null });

          // Get the current check-in to find the corresponding review
          const currentCheckIn = get().getCheckInById(checkInId);
          if (!currentCheckIn) {
            throw new Error('Check-in não encontrado');
          }

          // Prepare update data for review service
          const updateData: any = {};

          if (data.rating !== undefined) updateData.rating = data.rating;
          if (data.description !== undefined) updateData.comment = data.description;
          if (data.wouldReturn !== undefined && data.wouldReturn !== null) updateData.wouldReturn = data.wouldReturn;
          if (data.visitDate) updateData.visitDate = data.visitDate.toISOString();
          if (data.reviewType) updateData.reviewType = data.reviewType;
          if (data.photos) {
            updateData.photos = data.photos.map(
              (url): PhotoData => ({
                url,
                size: 0,
                width: 0,
                height: 0,
              })
            );
          }

          // Update review using the review service
          const reviewResponse = await reviewService.updateReview({
            reviewId: checkInId, // Using checkInId as reviewId since they're linked
            ...updateData,
          });

          if (!reviewResponse.success) {
            throw new Error(reviewResponse.error || 'Falha ao atualizar avaliação');
          }

          // Update local state
          set((state) => ({
            checkIns: state.checkIns.map((checkIn) =>
              checkIn.id === checkInId
                ? {
                    ...checkIn,
                    ...(data.rating !== undefined && { rating: data.rating }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.wouldReturn !== undefined &&
                      data.wouldReturn !== null && { wouldReturn: data.wouldReturn }),
                    ...(data.visitDate && { visitDate: data.visitDate.toISOString() }),
                    ...(data.reviewType && { reviewType: data.reviewType }),
                    ...(data.photos && {
                      photos: data.photos.map((url, index) => ({
                        id: `photo_${index}`,
                        url,
                        order: index,
                      })),
                    }),
                    updatedAt: new Date().toISOString(),
                  }
                : checkIn
            ),
            loading: false,
          }));

          console.log('Check-in updated successfully');
        } catch (error: any) {
          console.error('Error updating check-in:', error);
          set({
            loading: false,
            error: error.message || 'Falha ao atualizar check-in. Tente novamente.',
          });
          throw error;
        }
      },

      deleteCheckIn: async (checkInId: string) => {
        try {
          set({ loading: true, error: null });

          // Delete review using the review service
          const reviewResponse = await reviewService.deleteReview(checkInId);

          if (!reviewResponse.success) {
            throw new Error(reviewResponse.error || 'Falha ao deletar avaliação');
          }

          // Update local state
          set((state) => ({
            checkIns: state.checkIns.filter((checkIn) => checkIn.id !== checkInId),
            // Update userCheckIns as well
            userCheckIns: Object.fromEntries(
              Object.entries(state.userCheckIns).map(([placeId, checkIns]) => [
                placeId,
                checkIns.filter((checkIn) => checkIn.id !== checkInId),
              ])
            ),
            loading: false,
          }));

          console.log('Check-in deleted successfully');
        } catch (error: any) {
          console.error('Error deleting check-in:', error);
          set({
            loading: false,
            error: error.message || 'Falha ao excluir check-in. Tente novamente.',
          });
          throw error;
        }
      },

      // Data Retrieval
      getUserCheckIns: (placeId: string) => {
        const { userCheckIns } = get();
        return userCheckIns[placeId] || [];
      },

      getAllUserCheckIns: async () => {
        try {
          set({ loading: true, error: null });

          // Fetch user check-ins from the review service
          // TODO: Get current user ID from auth store
          const userId = 'current-user';
          const checkInsResponse = await reviewService.getUserCheckIns(userId);

          if (!checkInsResponse.success) {
            throw new Error(checkInsResponse.error || 'Falha ao carregar check-ins');
          }

          // Convert reviews to check-ins
          const checkIns: CheckIn[] = checkInsResponse.checkIns.map((review) => ({
            id: review.id,
            userId: review.userId,
            placeId: review.placeId,
            visitDate: review.visitDate || review.createdAt,
            rating: review.rating,
            reviewType: review.reviewType,
            description: review.comment,
            wouldReturn: review.wouldReturn,
            photos: review.photos.map((photo, index) => ({
              id: `photo_${index}`,
              url: photo.url,
              thumbnail: photo.thumbnail,
              order: index,
            })),
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
          }));

          // Group by placeId
          const userCheckIns: Record<string, CheckIn[]> = {};
          checkIns.forEach((checkIn) => {
            if (!userCheckIns[checkIn.placeId]) {
              userCheckIns[checkIn.placeId] = [];
            }
            userCheckIns[checkIn.placeId].push(checkIn);
          });

          set({
            checkIns,
            userCheckIns,
            loading: false,
          });
        } catch (error: any) {
          console.error('Error fetching user check-ins:', error);
          set({
            loading: false,
            error: error.message || 'Falha ao carregar check-ins. Tente novamente.',
          });
        }
      },

      getCheckInById: (checkInId: string) => {
        const { checkIns } = get();
        return checkIns.find((checkIn) => checkIn.id === checkInId) || null;
      },

      // Load place check-ins from review service
      loadPlaceCheckIns: async (placeId: string) => {
        try {
          set({ loading: true, error: null });

          const response = await reviewService.getPlaceCheckIns(placeId);

          if (!response.success) {
            throw new Error(response.error || 'Falha ao carregar check-ins do lugar');
          }

          // Convert reviews to check-ins
          const placeCheckIns: CheckIn[] = response.checkIns.map((review) => ({
            id: review.id,
            userId: review.userId,
            placeId: review.placeId,
            visitDate: review.visitDate || review.createdAt,
            rating: review.rating,
            reviewType: review.reviewType,
            description: review.comment,
            wouldReturn: review.wouldReturn,
            photos: review.photos.map((photo, index) => ({
              id: `photo_${index}`,
              url: photo.url,
              thumbnail: photo.thumbnail,
              order: index,
            })),
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
          }));

          // Update the userCheckIns for this place
          set((state) => ({
            userCheckIns: {
              ...state.userCheckIns,
              [placeId]: placeCheckIns,
            },
            loading: false,
          }));

          return placeCheckIns;
        } catch (error: any) {
          console.error('Error loading place check-ins:', error);
          set({
            loading: false,
            error: error.message || 'Falha ao carregar check-ins do lugar. Tente novamente.',
          });
          return [];
        }
      },

      // Check-in Flow State
      startCheckIn: (placeId: string) => {
        console.log('🚀 Starting check-in for place:', placeId);
        const newState = {
          ...initialCheckInState,
          formData: {
            ...initialCheckInState.formData,
            visitDate: new Date(), // Always start with current date
          },
        };
        console.log('🚀 Initial check-in state:', newState);
        set({
          currentCheckIn: newState,
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
        console.log('🔄 Updating form data with:', data);
        set((state) => {
          const newFormData = {
            ...state.currentCheckIn.formData,
            ...data,
          };
          console.log('🔄 New form data:', newFormData);
          return {
            currentCheckIn: {
              ...state.currentCheckIn,
              formData: newFormData,
              isValid: validateFormData(newFormData),
            },
          };
        });
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
      }),
    }
  )
);

// Helper function to validate form data
const validateFormData = (data: Partial<CheckInFormData>): boolean => {
  console.log('🔍 Validating form data:', data);
  const isValid = !!(
    data.visitDate &&
    data.rating !== undefined &&
    data.rating >= 0 &&
    data.rating <= 10 &&
    data.reviewType &&
    data.wouldReturn !== null
  );
  console.log('🔍 Form validation result:', isValid);
  return isValid;
};
