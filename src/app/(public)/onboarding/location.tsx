import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import useOnboardingStore from '@/store/onboardingStore';

const LocationScreen = () => {
  const router = useRouter();
  const { data, updateLocation } = useOnboardingStore();

  // Location state
  const [location, setLocation] = useState({
    state: data?.location?.state || '',
    city: data?.location?.city || '',
  });

  // Validation
  const validateLocation = () => {
    if (!location.state.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu estado');
      return false;
    }
    if (!location.city.trim()) {
      Alert.alert('Erro', 'Por favor, insira sua cidade');
      return false;
    }
    return true;
  };

  // Continue to next step
  const handleContinue = () => {
    if (!validateLocation()) return;
    
    // Store location in onboarding store
    updateLocation({
      state: location.state,
      city: location.city,
      country: 'Brasil'
    });
    console.log('Location stored:', location);
    
    router.push('/onboarding/permissions' as any);
  };

  const handleBack = () => {
    router.back();
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

      {/* Header */}
      <View className='px-6 py-4'>
        <View className='flex-row items-center justify-between mb-4'>
          <TouchableOpacity onPress={handleBack} className='p-2'>
            <Ionicons name='arrow-back' size={24} color='#6b7280' />
          </TouchableOpacity>
          
          <View className='flex-1 mx-4'>
            <Text className='text-center text-sm text-neutral-600 mb-2'>
              Passo 3 de 4
            </Text>
            <View className='h-2 bg-neutral-200 rounded-full'>
              <View 
                className='h-full bg-primary-500 rounded-full'
                style={{ width: '75%' }}
              />
            </View>
          </View>
          
          <View className='w-10' />
        </View>

        <View className='items-center mb-6'>
          <Text className='text-xl font-bold text-neutral-800 text-center'>
            Sua Localização
          </Text>
          <Text className='text-sm text-neutral-600 mt-2 text-center'>
            Isso nos ajuda a mostrar recomendações relevantes para sua região
          </Text>
        </View>
      </View>

      <ScrollView className='flex-1 px-6' showsVerticalScrollIndicator={false}>
        <View className='space-y-6'>
          {/* Location Icon */}
          <View className='items-center py-8'>
            <View className='w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-4'>
              <Ionicons name='location' size={40} color='#b13bff' />
            </View>
            <Text className='text-lg font-semibold text-neutral-800'>
              Onde você está?
            </Text>
            <Text className='text-sm text-neutral-600 text-center mt-2 leading-relaxed'>
              Precisamos saber sua localização para personalizar as recomendações e 
              mostrar lugares próximos a você.
            </Text>
          </View>

          {/* Estado */}
          <View>
            <Text className='text-neutral-700 font-medium text-sm ml-1 mb-2'>Estado</Text>
            <View className='bg-white border-2 border-neutral-200 rounded-xl px-4 py-4 mb-3 flex-row items-center'>
              <Ionicons name='location-outline' size={20} color='#6b7280' />
              <TextInput
                value={location.state}
                onChangeText={(text) => setLocation(prev => ({ ...prev, state: text }))}
                placeholder='Ex: São Paulo'
                placeholderTextColor='#9ca3af'
                autoCapitalize='words'
                className='flex-1 ml-3 text-neutral-800 text-base'
              />
            </View>
          </View>

          {/* Cidade */}
          <View>
            <Text className='text-neutral-700 font-medium text-sm ml-1 mb-2'>Cidade</Text>
            <View className='bg-white border-2 border-neutral-200 rounded-xl px-4 py-4 flex-row items-center'>
              <Ionicons name='business-outline' size={20} color='#6b7280' />
              <TextInput
                value={location.city}
                onChangeText={(text) => setLocation(prev => ({ ...prev, city: text }))}
                placeholder='Ex: São Paulo'
                placeholderTextColor='#9ca3af'
                autoCapitalize='words'
                className='flex-1 ml-3 text-neutral-800 text-base'
              />
            </View>
          </View>

          {/* Benefits */}
          <View className='bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 mt-6'>
            <Text className='text-lg font-semibold text-neutral-800 mb-4'>
              Por que precisamos desta informação?
            </Text>
            
            <View className='space-y-3'>
              <View className='flex-row items-start'>
                <View className='w-6 h-6 bg-green-100 rounded-full items-center justify-center mr-3 mt-0.5'>
                  <Ionicons name='checkmark' size={14} color='#16a34a' />
                </View>
                <Text className='text-sm text-neutral-700 flex-1'>
                  Mostrar restaurantes e bares próximos à sua região
                </Text>
              </View>
              
              <View className='flex-row items-start'>
                <View className='w-6 h-6 bg-green-100 rounded-full items-center justify-center mr-3 mt-0.5'>
                  <Ionicons name='checkmark' size={14} color='#16a34a' />
                </View>
                <Text className='text-sm text-neutral-700 flex-1'>
                  Personalizar recomendações baseadas na cultura local
                </Text>
              </View>
              
              <View className='flex-row items-start'>
                <View className='w-6 h-6 bg-green-100 rounded-full items-center justify-center mr-3 mt-0.5'>
                  <Ionicons name='checkmark' size={14} color='#16a34a' />
                </View>
                <Text className='text-sm text-neutral-700 flex-1'>
                  Conectar você com outros usuários da sua cidade
                </Text>
              </View>
            </View>
          </View>

          {/* Privacy Note */}
          <View className='bg-blue-50 rounded-xl p-4 border border-blue-200 mt-3'>
            <View className='flex-row items-center mb-2'>
              <Ionicons name='shield-checkmark' size={16} color='#2563eb' />
              <Text className='text-blue-800 font-medium ml-2'>Privacidade</Text>
            </View>
            <Text className='text-blue-700 text-sm'>
              Seus dados de localização são mantidos seguros e nunca compartilhados 
              com terceiros. Você pode alterar essas informações a qualquer momento nas configurações.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className='px-6 py-4 bg-white border-t border-neutral-200'>
        <View className='flex-row gap-2'>
          <TouchableOpacity
            onPress={handleBack}
            className='bg-neutral-200 rounded-xl px-6 py-4 items-center justify-center'
          >
            <Text className='text-neutral-700 font-semibold text-base'>Voltar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleContinue}
            className='flex-1 bg-primary-500 rounded-xl px-6 py-4 items-center justify-center'
          >
            <View className='flex-row items-center'>
              <Text className='text-white font-semibold text-base mr-2'>
                Continuar
              </Text>
              <Ionicons name='arrow-forward' size={16} color='white' />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LocationScreen;
