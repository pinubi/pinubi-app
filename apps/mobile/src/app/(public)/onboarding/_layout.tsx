import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';

const OnboardingLayout = () => {
  const { isSignedIn, isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {        
    // Only redirect if we're definitely not authenticated
    if (!loading && !isSignedIn && !isAuthenticated && !user) {      
      router.replace('/(public)/signin');
    }
    
    // TODO: Check if user has already completed onboarding
    // if (user && user.onboardingComplete) {
    //   router.replace('/(protected)/(tabs)/discover');
    // }
  }, [isSignedIn, isAuthenticated, loading, router, user]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#b13bff" />
      </View>
    );
  }

  // Only render onboarding if user is authenticated but not yet active
  if (isSignedIn || isAuthenticated || user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="location" />
        <Stack.Screen name="permissions" />
        <Stack.Screen name="invite" />
      </Stack>
    );
  }

  // Return empty view while redirecting
  return null;
};

export default OnboardingLayout;
