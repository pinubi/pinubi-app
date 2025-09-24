import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingComponentProps {
  message?: string;
}

export const LoadingComponent: React.FC<LoadingComponentProps> = ({
  message = "Carregando feed..."
}) => {
  return (
    <View className='flex-1 items-center justify-center px-6 py-12'>
      <ActivityIndicator size="large" color="#0ea5e9" />
      <Text className='text-gray-600 text-center text-base mt-4'>
        {message}
      </Text>
    </View>
  );
};
