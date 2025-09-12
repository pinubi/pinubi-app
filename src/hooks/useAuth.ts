import { useEffect } from 'react';

import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const {
    user,
    loading,
    error,
    isAuthenticated,
    signInWithGoogle,
    signInWithEmailAndPassword,
    signUpWithEmailAndPassword,
    signInWithMock,
    signOut,
    checkAuthState,
    clearError,
    updateUserValidation,
    resetPassword,
  } = useAuthStore();

  // Initialize auth state check on hook mount
  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  return {
    // State
    user,
    loading,
    error,
    isAuthenticated,
    
    // Actions
    signInWithGoogle,
    signInWithEmailAndPassword,
    signUpWithEmailAndPassword,
    signInWithMock,
    signOut,
    clearError,
    updateUserValidation,
    resetPassword,
    
    // Computed values
    isSignedIn: isAuthenticated && user !== null,
    userEmail: user?.email || null,
    userName: user?.name || null,
    userPhoto: user?.photo || null,
    
    // Validation status - per PLANEJAMENTO_JORNADAS_USUARIO.md
    isValidated: user?.isValidated || false,
    isActive: user?.isActive || false,
    onboardingComplete: user?.onboardingComplete || false,
    
    // Combined status - user can access protected routes only if validated AND active
    canAccessProtected: user?.isValidated === true && user?.isActive === true,
  };
};
