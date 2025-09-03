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

    console.log('Index: Current auth state:', {
      isSignedIn,
      isAuthenticated,
      canAccessProtected,
      isValidated,
      isActive,
    });

    console.log('Index: Checking conditions...');
    console.log('- Not authenticated?', !isSignedIn && !isAuthenticated);
    console.log('- Authenticated + not can access?', 
      (isSignedIn || isAuthenticated) && !canAccessProtected);
    console.log('- Can access protected?', canAccessProtected);

    // User is not authenticated at all - redirect to login
    if (!isSignedIn && !isAuthenticated) {
      console.log('Index: Navegando para login - não autenticado');
      router.replace('/(public)/login');
      return;
    }

    // User is authenticated but not validated/active - must complete onboarding
    // This is the source of truth - Firebase validation status, not local onboarding store
    if ((isSignedIn || isAuthenticated) && !canAccessProtected) {
      console.log('Index: Navegando para onboarding - usuário não validado/ativo');
      // Note: Welcome screen will reset onboarding store for fresh start
      router.replace('/(public)/onboarding/welcome');
      return;
    }

    // User is fully validated and active - go to protected area
    if (canAccessProtected) {
      console.log('Index: Navegando para discover - usuário validado e ativo');
      router.replace('/(protected)/(tabs)/discover');
      return;
    }

    // Fallback - if something is wrong, go to login
    console.log('Index: Fallback - navegando para login');
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
