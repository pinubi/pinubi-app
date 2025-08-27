import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import useOnboardingStore from '@/store/onboardingStore';

const PermissionsScreen = () => {
  const router = useRouter();
  const { data, updatePermissions, completeOnboarding, resetOnboarding } = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        setLocationPermissionGranted(true);
        Alert.alert('Sucesso!', 'Permissão de localização concedida com sucesso.');
      } else {
        Alert.alert(
          'Permissão negada',
          'Você pode conceder esta permissão mais tarde nas configurações do dispositivo.'
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Erro', 'Não foi possível solicitar a permissão de localização.');
    } finally {
      setLoading(false);
    }
  };

  // Continue to invite code screen
  const handleContinueToInvite = () => {
    // Store final permissions
    updatePermissions({
      locationGranted: locationPermissionGranted,
    });

    console.log('Permissions stored, continuing to invite code...');

    router.push('/onboarding/invite' as any);
  };

  // Skip location permission and go to invite
  const skipLocationPermission = () => {
    Alert.alert(
      'Pular permissão de localização',
      'Você pode conceder esta permissão mais tarde nas configurações do app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Pular', onPress: handleContinueToInvite },
      ]
    );
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
            <Text className='text-center text-sm text-neutral-600 mb-2'>Passo 4 de 5</Text>
            <View className='h-2 bg-neutral-200 rounded-full'>
              <View className='h-full bg-primary-500 rounded-full' style={{ width: '80%' }} />
            </View>
          </View>

          <View className='w-10' />
        </View>

        <View className='items-center mb-6'>
          <Text className='text-xl font-bold text-neutral-800 text-center'>Últimos ajustes</Text>
          <Text className='text-sm text-neutral-600 mt-2 text-center'>
            Permissões para uma experiência personalizada
          </Text>
        </View>
      </View>

      <ScrollView
        className='flex-1 px-6'
        showsVerticalScrollIndicator={false}        
      >
        {/* Location Permission */}
        <View className='bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 mb-3'>
          <View className='flex-row items-center mb-4'>
            <View
              className={`w-12 h-12 rounded-full items-center justify-center ${
                locationPermissionGranted ? 'bg-green-100' : 'bg-primary-100'
              }`}
            >
              <Ionicons
                name={locationPermissionGranted ? 'checkmark-circle' : 'location'}
                size={24}
                color={locationPermissionGranted ? '#16a34a' : '#b13bff'}
              />
            </View>
            <View className='flex-1 ml-4'>
              <Text className='text-lg font-semibold text-neutral-800'>Localização Precisa</Text>
              <Text className={`text-sm mt-1 ${locationPermissionGranted ? 'text-green-600' : 'text-neutral-600'}`}>
                {locationPermissionGranted ? 'Concedida ✓' : 'Recomendado'}
              </Text>
            </View>
          </View>

          <Text className='text-sm text-neutral-700 mb-4 leading-relaxed'>
            Permite que o app encontre restaurantes e bares próximos à sua localização atual, oferecendo sugestões mais
            relevantes e precisas.
          </Text>

          {!locationPermissionGranted && (
            <TouchableOpacity
              onPress={requestLocationPermission}
              disabled={loading}
              className='bg-primary-500 rounded-xl px-4 py-3 items-center justify-center'
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <ActivityIndicator size='small' color='white' />
              ) : (
                <Text className='text-white font-medium text-sm'>Conceder Permissão</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Benefits Summary */}
        <View className='bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-200 mb-3'>
          <View className='flex-row items-center mb-4'>
            <Ionicons name='star' size={20} color='#b13bff' />
            <Text className='text-primary-800 font-semibold ml-2'>Você está quase pronto!</Text>
          </View>

          <Text className='text-primary-700 text-sm leading-relaxed mb-4'>Com sua conta configurada, você poderá:</Text>

          <View className='space-y-2'>
            <View className='flex-row items-center'>
              <Ionicons name='restaurant' size={16} color='#b13bff' />
              <Text className='text-primary-700 text-sm ml-2'>Descobrir lugares incríveis</Text>
            </View>
            <View className='flex-row items-center'>
              <Ionicons name='list' size={16} color='#b13bff' />
              <Text className='text-primary-700 text-sm ml-2'>Criar suas listas de favoritos</Text>
            </View>
            <View className='flex-row items-center'>
              <Ionicons name='people' size={16} color='#b13bff' />
              <Text className='text-primary-700 text-sm ml-2'>Seguir amigos e ver suas recomendações</Text>
            </View>
            <View className='flex-row items-center'>
              <Ionicons name='sparkles' size={16} color='#b13bff' />
              <Text className='text-primary-700 text-sm ml-2'>Receber sugestões personalizadas da IA</Text>
            </View>
          </View>
        </View>

        {/* Privacy Note */}
        <View className='bg-blue-50 rounded-xl p-4 border border-blue-200'>
          <View className='flex-row items-center mb-2'>
            <Ionicons name='shield-checkmark' size={16} color='#2563eb' />
            <Text className='text-blue-800 font-medium ml-2'>Privacidade e Segurança</Text>
          </View>
          <Text className='text-blue-700 text-sm leading-relaxed'>
            Todos os seus dados são protegidos e criptografados. Você pode alterar suas preferências e permissões a
            qualquer momento nas configurações do app.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className='px-6 py-4 bg-white border-t border-neutral-200'>
        <View className='flex-row gap-2'>
          <TouchableOpacity
            onPress={handleBack}
            disabled={loading}
            className='bg-neutral-200 rounded-xl px-6 py-4 items-center justify-center'
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            <Text className='text-neutral-700 font-semibold text-base'>Voltar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={locationPermissionGranted ? handleContinueToInvite : skipLocationPermission}
            disabled={loading}
            className='flex-1 bg-primary-500 rounded-xl px-6 py-4 items-center justify-center'
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <View className='flex-row items-center'>
                <ActivityIndicator size='small' color='white' />
                <Text className='text-white font-semibold text-base ml-2'>Continuando...</Text>
              </View>
            ) : (
              <View className='flex-row items-center'>
                <Text className='text-white font-semibold text-base mr-2'>
                  {locationPermissionGranted ? 'Continuar' : 'Pular e continuar'}
                </Text>
                <Ionicons name='arrow-forward' size={16} color='white' />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PermissionsScreen;
