import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface EmptyFeedComponentProps {
  onRefresh?: () => void;
  handleSearchPress?: () => void;
  message?: string;
}

export const EmptyFeedComponent: React.FC<EmptyFeedComponentProps> = ({
  onRefresh,
  handleSearchPress,
  message = 'Seu feed está vazio',
}) => {
  const router = useRouter();

  const redirectToDiscover = () => {
    router.push('/(protected)/(tabs)/discover');
  };

  return (
    <View className='flex-1 items-center justify-center px-6 py-12'>
      {/* Icon */}
      <View className='bg-gray-100 rounded-full p-6 mb-6'>
        <Ionicons name='newspaper-outline' size={48} color='#9ca3af' />
      </View>

      {/* Message */}
      <Text className='text-gray-900 text-xl font-semibold text-center mb-2'>{message}</Text>

      <Text className='text-gray-600 text-center text-base mb-8 leading-6'>
        Comece seguindo pessoas ou explorando lugares próximos para ver atividades no seu feed.
      </Text>

      {/* Actions */}
      <View className='space-y-3 w-full'>
        {onRefresh && (
          <TouchableOpacity
            onPress={onRefresh}
            className='bg-primary-500 rounded-xl py-4 px-6 flex-row items-center justify-center'
          >
            <Ionicons name='refresh' size={20} color='white' />
            <Text className='text-white font-semibold ml-2'>Atualizar Feed</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={redirectToDiscover}
          className='bg-gray-100 rounded-xl py-4 px-6 flex-row items-center justify-center'
        >
          <Ionicons name='compass-outline' size={20} color='#6b7280' />
          <Text className='text-gray-700 font-semibold ml-2'>Explorar Lugares</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSearchPress}
          className='bg-gray-100 rounded-xl py-4 px-6 flex-row items-center justify-center'
        >
          <Ionicons name='people-outline' size={20} color='#6b7280' />
          <Text className='text-gray-700 font-semibold ml-2'>Encontrar Pessoas</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
