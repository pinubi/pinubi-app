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

    // User is not authenticated at all - redirect to signin
    if (!isSignedIn && !isAuthenticated) {      
      router.replace('/(public)/signin');
      return;
    }

    // User is authenticated but not validated/active - redirect to waitlist success
    if ((isSignedIn || isAuthenticated) && !canAccessProtected) {      
      router.replace('/(public)/onboarding/waitlist-success');
      return;
    }

    // User is fully validated and active - go to protected area
    if (canAccessProtected) {      
      router.replace('/(protected)/(tabs)/social');
      return;
    }

    // Fallback - if something is wrong, go to login    
    router.replace('/(public)/signin');
  }, [isSignedIn, isAuthenticated, loading, canAccessProtected, isValidated, isActive, router]);

  // Show loading screen while checking auth state and redirecting
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#b13bff" />
    </View>
  );
};

export default Index;
