import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

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
      <ActivityIndicator size="large" color="#b13bff" />
    </View>
  );
};

export default HomeScreen;