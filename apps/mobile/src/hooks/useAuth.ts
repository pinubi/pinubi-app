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

  // Initialize auth state check on hook mount with error handling
  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuthState();
      } catch (error) {
        console.warn('Auth state check failed:', error);
        // Don't throw the error to avoid breaking the component
      }
    };
    
    // Add a small delay to ensure navigation context is ready
    const timer = setTimeout(initAuth, 50);
    return () => clearTimeout(timer);
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
