import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';

const ProtectedLayout = () => {
  const { isSignedIn, isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('ProtectedLayout: Estado atual - loading:', loading, 'isSignedIn:', isSignedIn, 'isAuthenticated:', isAuthenticated, 'user:', user?.name || 'null');
    
    // Only redirect if we're definitely not authenticated
    // Give some leeway for mock authentication which might have timing issues
    if (!loading && !isSignedIn && !isAuthenticated && !user) {
      console.log('ProtectedLayout: Redirecionando para login - definitivamente não autenticado');
      router.replace('/(public)/login');
    }
  }, [isSignedIn, isAuthenticated, loading, router, user]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  // Show nothing while redirecting (prevents flash of protected content)
  if (!loading && !isSignedIn && !isAuthenticated && !user) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  // Render protected routes when authenticated (including mock)
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="viewList" />
    </Stack>
  );
};

export default ProtectedLayout;
