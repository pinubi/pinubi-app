import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const router = useRouter();
  const { isSignedIn, isAuthenticated, loading, canAccessProtected, isValidated, isActive } = useAuth();

  useEffect(() => {
    // Wait for auth state to be determined
    if (loading) return;

    // User is not authenticated at all - redirect to login
    if (!isSignedIn && !isAuthenticated) {      
      router.replace('/(public)/login');
      return;
    }

    // User is authenticated but not validated/active - must complete onboarding
    // This is the source of truth - Firebase validation status, not local onboarding store
    if ((isSignedIn || isAuthenticated) && !canAccessProtected) {      
      // Skip other onboarding steps and go directly to invite
      router.replace('/(public)/onboarding/invite');
      return;
    }

    // User is fully validated and active - go to protected area
    if (canAccessProtected) {      
      router.replace('/(protected)/(tabs)/social');
      return;
    }

    // Fallback - if something is wrong, go to login    
    router.replace('/(public)/login');
  }, [isSignedIn, isAuthenticated, loading, canAccessProtected, isValidated, isActive, router]);

  // Show loading screen while checking auth state and redirecting
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#4285F4" />
    </View>
  );
};

export default Index;
