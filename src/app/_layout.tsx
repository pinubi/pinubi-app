import '@/global.css';
import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    useFonts,
} from '@expo-google-fonts/poppins';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PortalProvider } from '@/components/ui';
import { useDeepLinking } from '@/hooks/useDeepLinking';

SplashScreen.preventAutoHideAsync();

const FONT_TIMEOUT_MS = 5000; // fallback para garantir que Splash esconda mesmo se fontes falharem

const InitialLayout = () => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize deep linking
  useDeepLinking();

  // Timeout de segurança
  useEffect(() => {
    const t = setTimeout(() => setTimeoutReached(true), FONT_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  // Esconde splash quando recursos prontos ou timeout
  useEffect(() => {
    if ((fontsLoaded || timeoutReached) && !appReady) {
      (async () => {
        await SplashScreen.hideAsync();
        setAppReady(true);
      })();
    }
  }, [fontsLoaded, timeoutReached, appReady]);

  // Fade-in da aplicação
  useEffect(() => {
    if (appReady) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [appReady, fadeAnim]);

  if (!appReady) {
    return null;
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <StatusBar hidden />
      <BottomSheetModalProvider>
        <PortalProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(public)" />
            <Stack.Screen name="(protected)" />
          </Stack>
        </PortalProvider>
      </BottomSheetModalProvider>
    </Animated.View>
  );
};

const RootLayout = () => {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={DefaultTheme}>
          <InitialLayout />
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

export default RootLayout;
