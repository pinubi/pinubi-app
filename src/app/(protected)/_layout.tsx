import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';

const ProtectedLayout = () => {
  const { isSignedIn, isAuthenticated, loading, canAccessProtected, isValidated, isActive, user } = useAuth();
  const router = useRouter();

  useEffect(() => {    
    // Don't redirect while loading
    if (loading) return;

    // Not authenticated at all - go to login
    if (!isSignedIn && !isAuthenticated) {      
      router.replace('/(public)/login');
      return;
    }

    // Authenticated but not validated/active - must complete onboarding
    if ((isSignedIn || isAuthenticated) && !canAccessProtected) {      
      router.replace('/(public)/onboarding/invite');
      return;
    }

    // If we reach here, user should have access to protected routes    
  }, [isSignedIn, isAuthenticated, loading, canAccessProtected, isValidated, isActive, router, user]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  // Show loading while redirecting to prevent flash of protected content
  if (!canAccessProtected) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#b13bff" />
      </View>
    );
  }

  // Render protected routes only when user is fully validated and active
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="viewList" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="followers" />
    </Stack>
  );
};

export default ProtectedLayout;
