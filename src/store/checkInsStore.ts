import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CheckIn, CheckInFormData, CheckInState } from '@/types/checkins';

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

          // Generate unique ID for the check-in
          const checkInId = `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const newCheckIn: CheckIn = {
            id: checkInId,
            userId: 'current-user', // TODO: Get from auth store
            placeId,
            visitDate: data.visitDate.toISOString(),
            rating: data.rating,
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

          // TODO: Send to Firebase
          // await checkInsService.createCheckIn(newCheckIn);
        } catch (error: any) {
          console.error('Error creating check-in:', error);
          set({ 
            loading: false, 
            error: 'Falha ao criar check-in. Tente novamente.' 
          });
        }
      },

      updateCheckIn: async (checkInId: string, data: Partial<CheckInFormData>) => {
        try {
          set({ loading: true, error: null });

          set((state) => ({
            checkIns: state.checkIns.map((checkIn) =>
              checkIn.id === checkInId
                ? {
                    ...checkIn,
                    ...(data.rating !== undefined && { rating: data.rating }),
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

          // TODO: Update in Firebase
          // await checkInsService.updateCheckIn(checkInId, data);
        } catch (error: any) {
          console.error('Error updating check-in:', error);
          set({ 
            loading: false, 
            error: 'Falha ao atualizar check-in. Tente novamente.' 
          });
        }
      },

      deleteCheckIn: async (checkInId: string) => {
        try {
          set({ loading: true, error: null });

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

          // TODO: Delete from Firebase
          // await checkInsService.deleteCheckIn(checkInId);
        } catch (error: any) {
          console.error('Error deleting check-in:', error);
          set({ 
            loading: false, 
            error: 'Falha ao excluir check-in. Tente novamente.' 
          });
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

          // TODO: Fetch from Firebase
          // const checkIns = await checkInsService.getUserCheckIns();
          // Group by placeId
          // const userCheckIns = groupBy(checkIns, 'placeId');
          
          set({ 
            // checkIns,
            // userCheckIns,
            loading: false 
          });
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

      // Check-in Flow State
      startCheckIn: (placeId: string) => {
        set({
          currentCheckIn: {
            ...initialCheckInState,
            formData: {
              ...initialCheckInState.formData,
              visitDate: new Date(), // Always start with current date
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
    data.wouldReturn !== null
  );
};
