import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ErrorComponentProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorComponent: React.FC<ErrorComponentProps> = ({
  error,
  onRetry
}) => {
  return (
    <View className='flex-1 items-center justify-center px-6 py-12'>
      {/* Icon */}
      <View className='bg-red-100 rounded-full p-6 mb-6'>
        <Ionicons name='alert-circle-outline' size={48} color='#ef4444' />
      </View>

      {/* Error message */}
      <Text className='text-gray-900 text-xl font-semibold text-center mb-2'>
        Ops! Algo deu errado
      </Text>
      
      <Text className='text-gray-600 text-center text-base mb-8 leading-6'>
        {error}
      </Text>

      {/* Retry button */}
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className='bg-primary-500 rounded-xl py-4 px-8 flex-row items-center justify-center'
        >
          <Ionicons name='refresh' size={20} color='white' />
          <Text className='text-white font-semibold ml-2'>Tentar Novamente</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
