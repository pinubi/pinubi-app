import { useEffect } from 'react';

import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const {
    user,
    loading,
    error,
    isAuthenticated,
    signInWithGoogle,
    signInWithMock,
    signOut,
    checkAuthState,
    clearError,
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
    signInWithMock,
    signOut,
    clearError,
    
    // Computed values
    isSignedIn: isAuthenticated && user !== null,
    userEmail: user?.email || null,
    userName: user?.name || null,
    userPhoto: user?.photo || null,
  };
};
