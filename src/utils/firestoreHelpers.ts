import { firestore, functions } from '@/config/firebase';
import { userService } from '@/services/userService';
import type { User } from '@/types/auth';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

/**
 * Fetches user validation status from Firestore
 * According to Funcoes_e_Triggers.md - users start with isValidated: false, isActive: false
 */
export const getUserValidationStatus = async (userId: string): Promise<{
  isValidated: boolean;
  isActive: boolean;
  onboardingComplete: boolean;
  userData?: any;
}> => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      
      return {
        isValidated: userData.isValidated || false,
        isActive: userData.isActive || false,
        onboardingComplete: userData.onboardingComplete || false,
        userData
      };
    } else {
      const isInitUser = await userService.initializeNewUser();

      if (isInitUser) {
        return getUserValidationStatus(userId);
      }
      // User document doesn't exist yet - return default values
      return {
        isValidated: false,
        isActive: false,
        onboardingComplete: false
      };
    }
  } catch (error) {
    // On error, return safe defaults
    return {
      isValidated: false,
      isActive: false,
      onboardingComplete: false
    };
  }
};

/**
 * Updates user validation status in Firestore
 * This syncs the local auth store with the backend state
 */
export const updateUserValidationInFirestore = async (
  userId: string, 
  isValidated: boolean, 
  isActive: boolean, 
  onboardingComplete: boolean = true
): Promise<boolean> => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    
    // For now, we'll just log this since we don't want to directly update Firestore
    // In production, this would be handled by Cloud Functions
    
    // TODO: In production, this should call a Cloud Function like:
    // const { data } = await httpsCallable(functions, 'updateUserValidation')({
    //   isValidated,
    //   isActive,
    //   onboardingComplete
    // });
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Maps Firebase Auth user data with Firestore user data
 * Combines authentication info with validation status
 */
export const mapFirebaseUserWithValidation = (
  firebaseUser: any,
  validationStatus: {
    isValidated: boolean;
    isActive: boolean;
    onboardingComplete: boolean;
    userData?: any;
  }
): User => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || validationStatus.userData?.displayName || '',
    photo: firebaseUser.photoURL || validationStatus.userData?.photoURL,
    givenName: firebaseUser.displayName?.split(' ')[0] || validationStatus.userData?.givenName,
    familyName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || validationStatus.userData?.familyName,
    createdAt: firebaseUser.metadata?.creationTime || validationStatus.userData?.createdAt,
    // Use validation status from Firestore (source of truth)
    isValidated: validationStatus.isValidated,
    isActive: validationStatus.isActive,
    onboardingComplete: validationStatus.onboardingComplete,
  };
};

/**
 * Validates invite code and activates user
 * This function calls the Cloud Function to validate the invite and activate the user
 */
export const validateInviteAndActivateUser = async (inviteCode: string): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> => {
  try {
    const validateInvite = httpsCallable(functions, 'validateInviteAndActivateUser');
    
    const result = await validateInvite({
      inviteCode: inviteCode.trim().toUpperCase()
    });
    
    return {
      success: true,
      data: result.data
    };
    
  } catch (error: any) {
    // Parse Cloud Functions error messages
    let errorMessage = 'Erro inesperado. Tente novamente.';
    
    if (error.code === 'functions/invalid-argument' || error.message?.includes('inválido')) {
      errorMessage = 'Código de convite inválido';
    } else if (error.message?.includes('já foi usado') || error.message?.includes('máximo de vezes')) {
      errorMessage = 'Este código já foi usado o máximo de vezes';
    } else if (error.message?.includes('já está validado')) {
      errorMessage = 'Usuário já está validado';
    } else if (error.code === 'functions/resource-exhausted' || error.message?.includes('rate limit') || error.message?.includes('muitas tentativas')) {
      errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
    } else if (error.code === 'functions/unauthenticated') {
      errorMessage = 'Usuário não autenticado. Faça login novamente.';
    } else if (error.code === 'functions/unavailable') {
      errorMessage = 'Serviço temporariamente indisponível. Tente novamente.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Updates user preferences after successful onboarding
 * This function calls the Cloud Function to update the user's profile with their preferences
 */
export const updateUserPreferences = async (preferences: {
  categories: string[];
  priceRange: number[];
  dietaryRestrictions: string[];
}): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> => {
  try {
    const updateProfile = httpsCallable(functions, 'updateUserProfile');
    
    const result = await updateProfile({
      preferences: {
        categories: preferences.categories,
        priceRange: preferences.priceRange,
        dietaryRestrictions: preferences.dietaryRestrictions
      }
    });
    
    return {
      success: true,
      data: result.data
    };
    
  } catch (error: any) {
    // Parse Cloud Functions error messages
    let errorMessage = 'Erro ao atualizar preferências. Tente novamente.';
    
    if (error.code === 'functions/invalid-argument') {
      errorMessage = 'Dados de preferências inválidos';
    } else if (error.code === 'functions/unauthenticated') {
      errorMessage = 'Usuário não autenticado. Faça login novamente.';
    } else if (error.code === 'functions/permission-denied') {
      errorMessage = 'Permissão negada para atualizar preferências';
    } else if (error.code === 'functions/unavailable') {
      errorMessage = 'Serviço temporariamente indisponível. Tente novamente.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Complete onboarding flow: validate invite and update preferences
 * This combines both invite validation and preference updates in the correct order
 * 
 * Note: Updated to support simplified flow where only invite code is required.
 * Preferences, location, and permissions can be provided as defaults and updated later.
 */
export const completeOnboardingFlow = async (
  inviteCode: string,
  preferences: {
    categories: string[];
    priceRange: number[];
    dietaryRestrictions: string[];
  },
  location: {
    state: string;
    city: string;
    country: string;
  },
  permissions: {
    locationGranted: boolean;
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> => {
  try {
    // Step 1: Validate invite code and activate user
    const inviteResult = await validateInviteAndActivateUser(inviteCode);
    
    if (!inviteResult.success) {
      return {
        success: false,
        error: inviteResult.error
      };
    }
    
    // Step 2: Update user preferences (only after successful validation)
    const preferencesResult = await updateUserPreferences(preferences);
    
    if (!preferencesResult.success) {
      return {
        success: false,
        error: `Convite validado, mas falha ao salvar preferências: ${preferencesResult.error}`
      };
    }
    
    return {
      success: true,
      data: {
        invite: inviteResult.data,
        preferences: preferencesResult.data,
        location,
        permissions
      }
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: 'Erro inesperado durante o onboarding. Tente novamente.'
    };
  }
};
