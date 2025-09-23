import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';

const ShareListScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isSignedIn, isAuthenticated, canAccessProtected } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listId = params.listId as string;

  useEffect(() => {
    // Simple validation
    if (!listId) {
      setError('ID da lista não fornecido');
      return;
    }

    // For now, just show a sign-in prompt for unauthenticated users
    if (!isSignedIn && !isAuthenticated) {
      setError('Entre na sua conta para ver esta lista');
    }
  }, [listId, isSignedIn, isAuthenticated]);

  const handleSignIn = () => {
    router.replace('/(public)/signin');
  };

  const handleViewList = () => {
    if (canAccessProtected && listId) {
      router.replace({
        pathname: '/(protected)/viewList',
        params: {
          listId: listId,
          title: 'Lista Compartilhada',
          emoji: '📋',
          description: 'Lista compartilhada via link',
          canDelete: 'false',
          canRename: 'false',
          placesCount: '0',
          isPublic: 'true',
        },
      });
    } else {
      Alert.alert(
        'Acesso Restrito',
        'Você precisa de uma conta ativa para visualizar listas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Entrar', onPress: handleSignIn },
        ]
      );
    }
  };

  const handleGoBack = () => {
    if (canAccessProtected) {
      router.replace('/(protected)/(tabs)/lists');
    } else {
      router.replace('/(public)/signin');
    }
  };

  if (loading) {
    return (
      <SafeAreaView className='flex-1'>
        <LinearGradient
          colors={['#f4e6ff', '#ffffff', '#f4e6ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className='absolute inset-0'
        />
        
        <View className='flex-1 items-center justify-center px-6'>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text className='text-gray-600 mt-4 text-center'>
            Carregando lista compartilhada...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className='flex-1'>
        <LinearGradient
          colors={['#f4e6ff', '#ffffff', '#f4e6ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className='absolute inset-0'
        />
        
        <View className='flex-1 items-center justify-center px-6'>
          <View className='w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-6'>
            <Ionicons name='share-outline' size={48} color='#3B82F6' />
          </View>
          
          <Text className='text-2xl font-bold text-gray-900 mb-4 text-center'>
            Lista Compartilhada
          </Text>
          
          <Text className='text-gray-600 text-center mb-8 leading-6'>
            {error}
          </Text>

          <View className='w-full space-y-4'>
            {!isSignedIn && !isAuthenticated && (
              <TouchableOpacity
                onPress={handleSignIn}
                className='w-full bg-primary-500 rounded-xl px-6 py-4 flex-row items-center justify-center'
              >
                <Ionicons name='log-in-outline' size={20} color='white' />
                <Text className='text-white font-semibold ml-2'>
                  Entrar no Pinubi
                </Text>
              </TouchableOpacity>
            )}
            
            {(isSignedIn || isAuthenticated) && (
              <TouchableOpacity
                onPress={handleViewList}
                className='w-full bg-primary-500 rounded-xl px-6 py-4 flex-row items-center justify-center'
              >
                <Ionicons name='eye-outline' size={20} color='white' />
                <Text className='text-white font-semibold ml-2'>
                  Ver Lista
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={handleGoBack}
              className='w-full bg-gray-100 rounded-xl px-6 py-4 flex-row items-center justify-center'
            >
              <Ionicons name='arrow-back-outline' size={20} color='#374151' />
              <Text className='text-gray-700 font-semibold ml-2'>
                Voltar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Success state (if we had fetched data successfully)
  return (
    <SafeAreaView className='flex-1'>
      <LinearGradient
        colors={['#f4e6ff', '#ffffff', '#f4e6ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className='absolute inset-0'
      />
      
      <View className='flex-1 items-center justify-center px-6'>
        <View className='bg-white rounded-3xl p-8 shadow-lg w-full max-w-sm'>
          <View className='items-center mb-6'>
            <Text className='text-6xl mb-4'>📋</Text>
            
            <Text className='text-2xl font-bold text-gray-900 mb-2 text-center'>
              Lista Compartilhada
            </Text>
            
            <Text className='text-gray-600 text-center mb-4'>
              ID: {listId}
            </Text>
            
            <View className='flex-row items-center mb-4'>
              <Ionicons name='location-outline' size={16} color='#9CA3AF' />
              <Text className='text-gray-500 ml-1'>
                Carregando lugares...
              </Text>
              
              <View className='mx-3 w-1 h-1 bg-gray-300 rounded-full' />
              
              <Ionicons name='globe-outline' size={16} color='#9CA3AF' />
              <Text className='text-gray-500 ml-1'>
                Pública
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleViewList}
            className='w-full bg-primary-500 rounded-xl px-6 py-4 flex-row items-center justify-center mb-4'
          >
            <Ionicons name='eye-outline' size={20} color='white' />
            <Text className='text-white font-semibold ml-2'>
              Ver Lista
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleGoBack}
            className='w-full bg-gray-100 rounded-xl px-6 py-4 flex-row items-center justify-center'
          >
            <Ionicons name='arrow-back-outline' size={20} color='#374151' />
            <Text className='text-gray-700 font-semibold ml-2'>
              Voltar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ShareListScreen;