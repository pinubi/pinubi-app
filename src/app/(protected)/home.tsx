import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

const HomeScreen = () => {
  const router = useRouter();

  useEffect(() => {
    // Small delay to ensure navigation is ready, then redirect to discover tab
    const timer = setTimeout(() => {
      router.replace('/(protected)/(tabs)/discover');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  // Show loading while redirecting
  return (
    <View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#4285F4" />
    </View>
  );
};

export default HomeScreen;