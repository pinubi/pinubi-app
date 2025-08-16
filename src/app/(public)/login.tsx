import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GoogleLogo from '@/components/GoogleLogo';
import { useAuth } from '@/hooks/useAuth';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const router = useRouter();
  const { signInWithGoogle, signInWithMock, loading, error, isSignedIn, isAuthenticated, clearError } = useAuth();

  // Check if we're running in Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';

  // Navigate to protected route when user is signed in (including mock)
  useEffect(() => {
    if (isSignedIn || isAuthenticated) {
      console.log('Navegando para tela protegida - isSignedIn:', isSignedIn, 'isAuthenticated:', isAuthenticated);
      router.replace('/(protected)/(tabs)/discover');
    }
  }, [isSignedIn, isAuthenticated, router]);

  // Show error alert when there's an authentication error
  useEffect(() => {
    if (error) {
      Alert.alert(
        'Erro no Login',
        error,
        [
          {
            text: 'OK',
            onPress: clearError,
          },
        ]
      );
    }
  }, [error, clearError]);

  const handleGoogleSignIn = async () => {
    try {
      console.log('Iniciando login com Google...');
      await signInWithGoogle();
      console.log('Login com Google concluído');
    } catch (err) {
      // Error is handled by the auth store and useEffect above
      console.error('Erro de login no componente:', err);
    }
  };

  const handleMockSignIn = async () => {
    try {
      console.log('Iniciando login de teste...');
      await signInWithMock();
      console.log('Login de teste concluído');
    } catch (err) {
      console.error('Erro de login de teste:', err);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#f4e6ff', '#ffffff', '#f4e6ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      
      {/* Decorative Background Elements - Adjusted for mobile */}
      <View className="absolute top-16 left-6 w-24 h-24 bg-primary-100 rounded-full opacity-20" />
      <View className="absolute top-32 right-8 w-20 h-20 bg-primary-200 rounded-full opacity-30" />
      <View className="absolute bottom-32 left-8 w-16 h-16 bg-primary-300 rounded-full opacity-25" />
      <View className="absolute bottom-48 right-6 w-20 h-20 bg-primary-100 rounded-full opacity-20" />

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Main Content */}
        <View className="flex-1 justify-center items-center px-6 py-8">
          
          {/* Brand Section */}
          <View className="items-center mb-12">
            {/* App Icon/Logo */}
            <View className="w-20 h-20 bg-primary-500 rounded-2xl mb-6 items-center justify-center shadow-lg">
              <Ionicons name="location" size={32} color="white" />
            </View>
            
            {/* App Name */}
            <Text className="text-3xl font-bold text-primary-800 mb-2 tracking-wide">
              Pinubi
            </Text>
            
            {/* Tagline */}
            <Text className="text-base text-primary-600 text-center mb-2 font-medium">
              Seu Companheiro Digital
            </Text>
            <Text className="text-sm text-neutral-600 text-center leading-5 px-2">
              Descubra, organize e compartilhe os lugares que importam para você
            </Text>
          </View>

          {/* Benefits Section */}
          <View className="mb-10 w-full max-w-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="compass" size={16} color="#b13bff" />
              </View>
              <Text className="text-neutral-700 flex-1 text-sm">Descubra lugares especiais</Text>
            </View>
            
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="people" size={16} color="#b13bff" />
              </View>
              <Text className="text-neutral-700 flex-1 text-sm">Conecte-se com amigos através de lugares</Text>
            </View>
            
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="heart" size={16} color="#b13bff" />
              </View>
              <Text className="text-neutral-700 flex-1 text-sm">Crie coleções das suas memórias</Text>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={loading}
            className="bg-white border-2 border-primary-200 rounded-2xl px-6 py-4 flex-row items-center justify-center shadow-lg w-full max-w-sm mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              transform: loading ? [{ scale: 0.98 }] : [{ scale: 1 }],
            }}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color="#b13bff" />
                <Text className="ml-3 text-primary-600 font-semibold text-base">
                  Entrando...
                </Text>
              </>
            ) : (
              <>
                <GoogleLogo size={20} />
                <Text className="ml-3 text-neutral-800 font-semibold text-base">
                  Continuar com Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Mock Sign In Button - Only show in Expo Go */}
          {isExpoGo && (
            <TouchableOpacity
              onPress={handleMockSignIn}
              disabled={loading}
              className="bg-primary-500 rounded-2xl px-6 py-4 flex-row items-center justify-center shadow-lg w-full max-w-sm"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                transform: loading ? [{ scale: 0.98 }] : [{ scale: 1 }],
              }}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="ml-3 text-white font-semibold text-base">
                    Entrando...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="rocket" size={20} color="white" />
                  <Text className="ml-3 text-white font-semibold text-base">
                    Entrar no Modo Teste (Expo Go)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Additional Call to Action */}
          <Text className="text-neutral-500 text-center mt-6 px-6 leading-5 text-xs">
            Comece sua jornada de descoberta e transforme cada lugar em uma história que vale a pena compartilhar
          </Text>

          {/* Expo Go Note */}
          {isExpoGo && (
            <View className="mt-4 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200 w-full max-w-sm">
              <View className="flex-row items-center">
                <Ionicons name="information-circle" size={18} color="#3b82f6" />
                <Text className="text-blue-600 text-xs ml-2 flex-1">
                  Você está usando o Expo Go. Use o "Modo Teste" para navegar pelo app.
                </Text>
              </View>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View className="mt-6 px-4 py-3 bg-red-50 rounded-xl border border-red-200 w-full max-w-sm">
              <View className="flex-row items-center">
                <Ionicons name="alert-circle" size={18} color="#dc2626" />
                <Text className="text-red-600 text-xs ml-2 flex-1">{error}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View className="pb-8 items-center px-6">
          <Text className="text-neutral-400 text-xs text-center">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;
