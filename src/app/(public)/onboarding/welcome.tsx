import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PinubiLogo from '@/components/PinubiLogo';
import { useAuth } from '@/hooks/useAuth';
import useOnboardingStore from '@/store/onboardingStore';

const WelcomeScreen = () => {
  const router = useRouter();
  const { isValidated, isActive } = useAuth();
  const { resetOnboarding } = useOnboardingStore();

  // Reset onboarding data when starting the welcome screen for users who aren't validated yet
  useEffect(() => {
    console.log('WelcomeScreen: User validation status:', { isValidated, isActive });
    
    // If user is not validated/active, reset onboarding to start fresh
    if (!isValidated || !isActive) {
      console.log('WelcomeScreen: User is not validated/active - resetting onboarding data for fresh start');
      console.log('WelcomeScreen: This ensures the user sees empty forms instead of previous data');
      resetOnboarding();
    } else {
      console.log('WelcomeScreen: User is already validated/active - keeping existing data');
    }
  }, [isValidated, isActive, resetOnboarding]);

  const handleContinue = () => {
    router.push('/onboarding/preferences' as any);
  };

  return (
    <SafeAreaView className='flex-1'>      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#f4e6ff', '#ffffff', '#f4e6ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className='absolute inset-0'
      />

      {/* Decorative Background Elements */}
      <View className='absolute top-16 left-6 w-24 h-24 bg-primary-100 rounded-full opacity-20' />
      <View className='absolute top-32 right-8 w-20 h-20 bg-primary-200 rounded-full opacity-30' />
      <View className='absolute bottom-32 left-8 w-16 h-16 bg-primary-150 rounded-full opacity-25' />

      <ScrollView className='flex-1 px-6' showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className='items-center pt-8 pb-6'>
          <PinubiLogo size={48} color='#b13bff' />
          <Text className='text-2xl font-bold text-primary-800 mt-4'>
            Bem-vindo ao Pinubi! 🎉
          </Text>
          <Text className='text-lg text-neutral-600 mt-2 text-center'>
            Sua conta foi criada com sucesso
          </Text>
        </View>

        {/* Welcome Content */}
        <View className='flex-col gap-3 space-y-6 mt-4'>
          {/* App Introduction */}
          <View className='bg-white rounded-2xl p-6 shadow-sm border border-neutral-100'>
            <View className='flex-row items-center mb-4'>
              <View className='w-12 h-12 bg-primary-100 rounded-full items-center justify-center'>
                <Ionicons name='restaurant' size={24} color='#b13bff' />
              </View>
              <View className='flex-1 ml-4'>
                <Text className='text-lg font-semibold text-neutral-800'>
                  Descubra lugares incríveis
                </Text>
                <Text className='text-sm text-neutral-600 mt-1'>
                  Encontre restaurantes, bares e cafés únicos
                </Text>
              </View>
            </View>
          </View>

          <View className='bg-white rounded-2xl p-6 shadow-sm border border-neutral-100'>
            <View className='flex-row items-center mb-4'>
              <View className='w-12 h-12 bg-primary-100 rounded-full items-center justify-center'>
                <Ionicons name='list' size={24} color='#b13bff' />
              </View>
              <View className='flex-1 ml-4'>
                <Text className='text-lg font-semibold text-neutral-800'>
                  Organize suas descobertas
                </Text>
                <Text className='text-sm text-neutral-600 mt-1'>
                  Crie listas personalizadas dos seus lugares favoritos
                </Text>
              </View>
            </View>
          </View>

          <View className='bg-white rounded-2xl p-6 shadow-sm border border-neutral-100'>
            <View className='flex-row items-center mb-4'>
              <View className='w-12 h-12 bg-primary-100 rounded-full items-center justify-center'>
                <Ionicons name='people' size={24} color='#b13bff' />
              </View>
              <View className='flex-1 ml-4'>
                <Text className='text-lg font-semibold text-neutral-800'>
                  Compartilhe com amigos
                </Text>
                <Text className='text-sm text-neutral-600 mt-1'>
                  Descubra o que seus amigos estão recomendando
                </Text>
              </View>
            </View>
          </View>

          <View className='bg-white rounded-2xl p-6 shadow-sm border border-neutral-100'>
            <View className='flex-row items-center mb-4'>
              <View className='w-12 h-12 bg-primary-100 rounded-full items-center justify-center'>
                <Ionicons name='sparkles' size={24} color='#b13bff' />
              </View>
              <View className='flex-1 ml-4'>
                <Text className='text-lg font-semibold text-neutral-800'>
                  IA personalizada
                </Text>
                <Text className='text-sm text-neutral-600 mt-1'>
                  Receba sugestões baseadas nas suas preferências
                </Text>
              </View>
            </View>
          </View>

          {/* Next Steps */}
          <View className='bg-primary-50 rounded-2xl p-6 border border-primary-200 mt-2'>
            <View className='flex-row items-center mb-3'>
              <Ionicons name='information-circle' size={20} color='#b13bff' />
              <Text className='text-primary-800 font-semibold ml-2'>Próximos passos</Text>
            </View>
            <Text className='text-primary-700 text-sm leading-relaxed'>
              Vamos personalizar sua experiência! Nos próximos passos, você vai configurar suas preferências 
              de comida, localização e dar as permissões necessárias para o app funcionar perfeitamente.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className='px-6 py-4 bg-white border-t border-neutral-200'>
        <TouchableOpacity
          onPress={handleContinue}
          className='bg-primary-500 rounded-xl px-6 py-4 items-center justify-center'
        >
          <View className='flex-row items-center'>
            <Text className='text-white font-semibold text-base mr-2'>
              Vamos começar
            </Text>
            <Ionicons name='arrow-forward' size={16} color='white' />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
