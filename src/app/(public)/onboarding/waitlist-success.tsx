import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PinubiLogo from '@/components/PinubiLogo';

const WaitlistSuccessScreen = () => {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations sequence
    const startAnimations = () => {
      // Logo rotation animation (continuous)
      Animated.loop(
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Main content animations
      Animated.sequence([
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Scale in success icon
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.back(1.5),
          useNativeDriver: true,
        }),
        // Slide up content
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    };

    startAnimations();
  }, []);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleGoToInvite = () => {
    router.navigate('/(public)/onboarding/invite');
  };

  const handleEarlyAccess = () => {
    // TODO: Implement payment flow for early access
    Linking.openURL('https://pinubi.app/early-access');
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
      <View className='absolute bottom-32 left-8 w-16 h-16 bg-primary-300 rounded-full opacity-25' />
      <View className='absolute bottom-48 right-6 w-20 h-20 bg-primary-100 rounded-full opacity-20' />

      <Animated.View 
        className='flex-1'
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Header */}
        <View className='px-6 py-4'>
          <View className='items-center mb-6'>
            {/* <Animated.View style={{ transform: [{ rotate: logoRotate }] }}> */}
              <PinubiLogo size={48} color='#b13bff' />
            {/* </Animated.View> */}
            <Text className='text-2xl font-bold text-primary-800 mt-4'>
              Bem-vindo ao Pinubi! 🎉
            </Text>
            <Text className='text-sm text-neutral-600 mt-2 text-center'>
              Você está na lista de espera para o acesso antecipado
            </Text>
          </View>
        </View>

        <ScrollView className='flex-1 px-6' showsVerticalScrollIndicator={false}>
          <View className='space-y-6'>
            {/* Success Icon Animation */}
            <View className='items-center py-8'>
              <Animated.View 
                className='w-32 h-32 bg-green-100 rounded-full items-center justify-center mb-6'
                style={{
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <Ionicons name='checkmark-circle' size={64} color='#10b981' />
              </Animated.View>
              <Text className='text-xl font-bold text-neutral-800 text-center mb-2'>
                Conta Criada com Sucesso!
              </Text>              
            </View>

            {/* Options Cards */}
            <View className='flex-col gap-3 space-y-4'>
              {/* Invite Code Option */}
              <TouchableOpacity
                onPress={handleGoToInvite}
                className='bg-primary-500 rounded-2xl p-6 shadow-lg'
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View className='flex-row items-center mb-3'>
                  <View className='w-12 h-12 bg-white/30 rounded-full items-center justify-center mr-4'>
                    <Ionicons name='ticket' size={24} color='white' />
                  </View>
                  <View className='flex-1'>
                    <Text className='text-white font-bold text-lg'>
                      Tenho um Código de Convite
                    </Text>
                    <Text className='text-white/90 text-sm'>
                      Ative sua conta agora mesmo
                    </Text>
                  </View>
                  <Ionicons name='arrow-forward' size={20} color='white' />
                </View>
                <Text className='text-white text-sm leading-relaxed'>
                  Se você já tem um código de convite de 6 caracteres, pode ativar sua conta imediatamente e começar a usar o Pinubi.
                </Text>
              </TouchableOpacity>

              {/* Early Access Payment Option */}
              <TouchableOpacity
                onPress={handleEarlyAccess}
                className='bg-purple-600 rounded-2xl p-6 shadow-lg'
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View className='flex-row items-center mb-3'>
                  <View className='w-12 h-12 bg-white/30 rounded-full items-center justify-center mr-4'>
                    <Ionicons name='flash' size={24} color='white' />
                  </View>
                  <View className='flex-1'>
                    <Text className='text-white font-bold text-lg'>
                      Acesso Antecipado Premium
                    </Text>
                    <Text className='text-white/90 text-sm'>
                      Pule a fila e tenha acesso imediato
                    </Text>
                  </View>
                  <Ionicons name='arrow-forward' size={20} color='white' />
                </View>
                <Text className='text-white text-sm leading-relaxed'>
                  Obtenha acesso imediato ao Pinubi com benefícios exclusivos e suporte prioritário.
                </Text>
              </TouchableOpacity>
            </View>            
          </View>
        </ScrollView>

        {/* Footer */}
        <View className='px-6 py-4 bg-white/80 border-t border-neutral-200'>
          <Text className='text-center text-xs text-neutral-500 leading-relaxed'>
            Obrigado por se juntar ao Pinubi! Estamos animados para você descobrir lugares incríveis conosco.
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default WaitlistSuccessScreen;
