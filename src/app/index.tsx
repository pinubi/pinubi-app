import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const router = useRouter();
  const { isSignedIn, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Wait for auth state to be determined
    if (loading) return;

    // Redirect based on authentication status (including mock)
    if (isSignedIn || isAuthenticated) {
      console.log('Index: Navegando para discover - isSignedIn:', isSignedIn, 'isAuthenticated:', isAuthenticated);
      router.replace('/(protected)/(tabs)/discover');
    } else {
      console.log('Index: Navegando para login - não autenticado');
      router.replace('/(public)/login');
    }
  }, [isSignedIn, isAuthenticated, loading, router]);

  // Show loading screen while checking auth state and redirecting
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#4285F4" />
    </View>
  );
};

export default Index;
