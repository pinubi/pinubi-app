import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { useCheckInsStore } from '@/store/checkInsStore';
import type { CheckIn } from '@/types/checkins';

interface CheckInHistoryProps {
  placeId: string;
  onShowAll?: () => void;
  maxVisible?: number;
}

const CheckInHistory: React.FC<CheckInHistoryProps> = ({
  placeId,
  onShowAll,
  maxVisible = 2,
}) => {
  const { getUserCheckIns } = useCheckInsStore();
  const userCheckIns = getUserCheckIns(placeId);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }

    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'hoje';
    if (diffInDays === 1) return 'ontem';
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} semana${Math.floor(diffInDays / 7) > 1 ? 's' : ''} atrás`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} mês${Math.floor(diffInDays / 30) > 1 ? 'es' : ''} atrás`;
    return `${Math.floor(diffInDays / 365)} ano${Math.floor(diffInDays / 365) > 1 ? 's' : ''} atrás`;
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 8) return 'text-green-600';
    if (rating >= 6) return 'text-yellow-600';
    if (rating >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRatingBgColor = (rating: number): string => {
    if (rating >= 8) return 'bg-green-50';
    if (rating >= 6) return 'bg-yellow-50';
    if (rating >= 4) return 'bg-orange-50';
    return 'bg-red-50';
  };

  if (userCheckIns.length === 0) {
    return null;
  }

  const visibleCheckIns = userCheckIns.slice(0, maxVisible);
  const hasMoreCheckIns = userCheckIns.length > maxVisible;

  return (
    <View className='px-4 pb-6'>
      <View className='flex-row items-center justify-between mb-4'>
        <Text className='text-xl font-bold text-gray-900'>
          Suas Visitas
        </Text>
        <View className='flex-row items-center'>
          <Ionicons name='location' size={16} color='#9333EA' />
          <Text className='text-primary-600 font-medium ml-1'>
            {userCheckIns.length} {userCheckIns.length === 1 ? 'visita' : 'visitas'}
          </Text>
        </View>
      </View>

      {visibleCheckIns.map((checkIn: CheckIn) => (
        <View key={checkIn.id} className='bg-gray-50 rounded-xl p-4 mb-3'>
          {/* Header */}
          <View className='flex-row justify-between items-start mb-3'>
            <View className='flex-1'>
              <Text className='text-gray-900 font-medium text-base'>
                {formatDate(checkIn.visitDate)}
              </Text>
              <Text className='text-gray-500 text-sm'>
                Check-in realizado {formatRelativeDate(checkIn.createdAt)}
              </Text>
            </View>
            
            <View className={`px-3 py-1 rounded-full ${getRatingBgColor(checkIn.rating)}`}>
              <View className='flex-row items-center'>
                <Ionicons name='star' size={14} color='#FBBF24' />
                <Text className={`font-semibold ml-1 text-sm ${getRatingColor(checkIn.rating)}`}>
                  {checkIn.rating.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>

          {/* Photos */}
          {checkIn.photos.length > 0 && (
            <View className='flex-row mb-3'>
              {checkIn.photos.slice(0, 3).map((photo, index) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.url }}
                  className='w-16 h-16 rounded-lg mr-2'
                  resizeMode='cover'
                />
              ))}
              {checkIn.photos.length > 3 && (
                <View className='w-16 h-16 rounded-lg bg-gray-200 items-center justify-center'>
                  <Text className='text-gray-600 text-xs font-medium'>
                    +{checkIn.photos.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Description */}
          {checkIn.description && (
            <Text className='text-gray-600 text-sm mb-3 leading-relaxed'>
              {checkIn.description.length > 120 
                ? `${checkIn.description.substring(0, 120)}...`
                : checkIn.description
              }
            </Text>
          )}

          {/* Footer */}
          <View className='flex-row items-center justify-between'>
            <View className='flex-row items-center'>
              <Ionicons 
                name={checkIn.wouldReturn ? 'thumbs-up' : 'thumbs-down'} 
                size={16} 
                color={checkIn.wouldReturn ? '#10B981' : '#EF4444'} 
              />
              <Text className={`text-sm ml-2 font-medium ${
                checkIn.wouldReturn ? 'text-green-600' : 'text-red-600'
              }`}>
                {checkIn.wouldReturn ? 'Voltaria' : 'Não voltaria'}
              </Text>
            </View>

            {checkIn.photos.length > 0 && (
              <View className='flex-row items-center'>
                <Ionicons name='camera' size={14} color='#6B7280' />
                <Text className='text-gray-500 text-sm ml-1'>
                  {checkIn.photos.length}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}

      {/* Show All Button */}
      {hasMoreCheckIns && (
        <TouchableOpacity 
          onPress={onShowAll}
          className='items-center py-3'
        >
          <Text className='text-primary-600 font-medium'>
            Ver todas as {userCheckIns.length} visitas
          </Text>
        </TouchableOpacity>
      )}

      {/* Summary Stats */}
      <View className='mt-4 p-4 bg-primary-50 rounded-xl'>
        <View className='flex-row items-center justify-between'>
          <View className='items-center flex-1'>
            <Text className='text-2xl font-bold text-primary-700'>
              {userCheckIns.length}
            </Text>
            <Text className='text-primary-600 text-sm font-medium'>
              {userCheckIns.length === 1 ? 'Visita' : 'Visitas'}
            </Text>
          </View>
          
          <View className='w-px h-8 bg-primary-200' />
          
          <View className='items-center flex-1'>
            <Text className='text-2xl font-bold text-primary-700'>
              {(userCheckIns.reduce((sum, c) => sum + c.rating, 0) / userCheckIns.length).toFixed(1)}
            </Text>
            <Text className='text-primary-600 text-sm font-medium'>
              Nota Média
            </Text>
          </View>
          
          <View className='w-px h-8 bg-primary-200' />
          
          <View className='items-center flex-1'>
            <Text className='text-2xl font-bold text-primary-700'>
              {Math.round((userCheckIns.filter(c => c.wouldReturn).length / userCheckIns.length) * 100)}%
            </Text>
            <Text className='text-primary-600 text-sm font-medium'>
              Voltaria
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CheckInHistory;
