import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface OnboardingData {
  // User preferences from step 2
  preferences: {
    categories: string[];
    priceRange: number[];
    dietaryRestrictions: string[];
  };
  // Location from step 3
  location: {
    state: string;
    city: string;
    country: string;
  };
  // Permissions from step 4
  permissions: {
    locationGranted: boolean;
  };
  // Signup data from step 1
  signup: {
    inviteCode: string;
    displayName: string;
  };
}

interface OnboardingState {
  data: Partial<OnboardingData>;
  currentStep: number;
  isCompleted: boolean;
}

interface OnboardingStore extends OnboardingState {
  // Update onboarding data
  updatePreferences: (preferences: OnboardingData['preferences']) => void;
  updateLocation: (location: OnboardingData['location']) => void;
  updatePermissions: (permissions: OnboardingData['permissions']) => void;
  updateSignup: (signup: OnboardingData['signup']) => void;
  
  // Step management
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Complete onboarding
  completeOnboarding: () => void;
  
  // Reset onboarding data
  resetOnboarding: () => void;
}

const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      data: {},
      currentStep: 1,
      isCompleted: false,

      updatePreferences: (preferences) => 
        set((state) => ({
          data: { ...state.data, preferences }
        })),

      updateLocation: (location) => 
        set((state) => ({
          data: { ...state.data, location }
        })),

      updatePermissions: (permissions) => 
        set((state) => ({
          data: { ...state.data, permissions }
        })),

      updateSignup: (signup) => 
        set((state) => ({
          data: { ...state.data, signup }
        })),

      setCurrentStep: (step) => 
        set({ currentStep: step }),

      nextStep: () => 
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 4)
        })),

      prevStep: () => 
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1)
        })),

      completeOnboarding: () => 
        set({ isCompleted: true, currentStep: 4 }),

      resetOnboarding: () => 
        set({ 
          data: {}, 
          currentStep: 1, 
          isCompleted: false 
        }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        data: state.data,
        currentStep: state.currentStep,
        isCompleted: state.isCompleted,
      }),
    }
  )
);

export default useOnboardingStore;
