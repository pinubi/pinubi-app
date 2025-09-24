
import { Ionicons } from '@expo/vector-icons';
import { Reviews } from '@pinubi/types';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface CheckInHistoryProps {
  placeId: string;
  onShowAll?: () => void;
  maxVisible?: number;
  checkIns: Reviews[] | [];
}

const CheckInHistory: React.FC<CheckInHistoryProps> = ({ onShowAll, maxVisible = 5, checkIns = [] }) => {
  const formatDate = (timestamp: string): string => {
    try {
      if (!timestamp) {
        return 'Data não disponível';
      }

      let date: Date = new Date(timestamp);

      // Validate the date
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }

      if (isToday(date)) {
        return 'Hoje';
      }

      if (isYesterday(date)) {
        return 'Ontem';
      }

      const currentYear = new Date().getFullYear();
      const dateYear = date.getFullYear();

      // If it's the same year, don't show the year
      if (dateYear === currentYear) {
        return format(date, 'd MMM', { locale: ptBR });
      }

      // If it's a different year, show the year
      return format(date, 'd MMM yyyy', { locale: ptBR });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Data inválida';
    }
  };

  const formatRelativeDate = (timestamp: any): string => {
    try {
      if (!timestamp) {
        return 'há algum tempo';
      }

      let date: Date = new Date(timestamp);

      // Validate the date
      if (isNaN(date.getTime())) {
        return 'há algum tempo';
      }

      if (isToday(date)) {
        return 'hoje';
      }

      if (isYesterday(date)) {
        return 'ontem';
      }

      // Use date-fns formatDistanceToNow for more natural language
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: ptBR,
      });
    } catch (error) {
      console.error('Error formatting relative date:', error);
      return 'há algum tempo';
    }
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

  // Filter out invalid checkIns and only show valid ones
  const validCheckIns = checkIns.filter(
    (checkIn) => checkIn && checkIn.id && typeof checkIn.rating === 'number' && checkIn.photos
  );

  if (validCheckIns.length === 0) {
    return null;
  }

  const visibleCheckIns = validCheckIns.slice(0, maxVisible);
  const hasMoreCheckIns = validCheckIns.length > maxVisible;

  return (
    <View className='px-4 pb-6'>
      <View className='flex-row items-center justify-between mb-4'>
        <Text className='text-xl font-bold text-gray-900'>Check-Ins</Text>
        <View className='flex-row items-center'>
          <Ionicons name='location' size={16} color='#9333EA' />
          <Text className='text-primary-600 font-medium ml-1'>
            {validCheckIns.length} {validCheckIns.length === 1 ? 'check-in' : 'check-ins'}
          </Text>
        </View>
      </View>

      {visibleCheckIns.map((checkIn) => (
        <View key={checkIn.id} className='bg-gray-50 rounded-xl p-4 mb-3'>
          {/* Header */}
          <View className='flex-row justify-between items-start mb-3'>
            <View className='flex-1'>
              <Text className='text-gray-900 font-medium text-base'>Visita: {formatDate(checkIn.visitDate)}</Text>
              <Text className='text-gray-500 text-sm'>Check-in realizado {formatRelativeDate(checkIn.createdAt)}</Text>
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
                <Image key={index} source={{ uri: photo }} className='w-16 h-16 rounded-lg mr-2' resizeMode='cover' />
              ))}
              {checkIn.photos.length > 3 && (
                <View className='w-16 h-16 rounded-lg bg-gray-200 items-center justify-center'>
                  <Text className='text-gray-600 text-xs font-medium'>+{checkIn.photos.length - 3}</Text>
                </View>
              )}
            </View>
          )}

          {/* Description */}
          {checkIn.comment && (
            <Text className='text-gray-600 text-sm mb-3 leading-relaxed'>
              {checkIn.comment.length > 120 ? `${checkIn.comment.substring(0, 120)}...` : checkIn.comment}
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
              <Text className={`text-sm ml-2 font-medium ${checkIn.wouldReturn ? 'text-green-600' : 'text-red-600'}`}>
                {checkIn.wouldReturn ? 'Voltaria' : 'Não voltaria'}
              </Text>
            </View>

            {checkIn.photos.length > 0 && (
              <View className='flex-row items-center'>
                <Ionicons name='camera' size={14} color='#6B7280' />
                <Text className='text-gray-500 text-sm ml-1'>{checkIn.photos.length}</Text>
              </View>
            )}
          </View>
        </View>
      ))}

      {/* Show All Button */}
      {hasMoreCheckIns && (
        <TouchableOpacity onPress={onShowAll} className='items-center py-3'>
          <Text className='text-primary-600 font-medium'>Ver todas as {checkIns.length} visitas</Text>
        </TouchableOpacity>
      )}

      {/* Summary Stats */}
      <View className='mt-4 p-4 bg-primary-50 rounded-xl'>
        <View className='flex-row items-center justify-between'>
          <View className='items-center flex-1'>
            <Text className='text-2xl font-bold text-primary-700'>{checkIns.length}</Text>
            <Text className='text-primary-600 text-sm font-medium'>{checkIns.length === 1 ? 'Visita' : 'Visitas'}</Text>
          </View>

          <View className='w-px h-8 bg-primary-200' />

          <View className='items-center flex-1'>
            <Text className='text-2xl font-bold text-primary-700'>
              {(checkIns.reduce((sum, c) => sum + c.rating, 0) / checkIns.length).toFixed(1)}
            </Text>
            <Text className='text-primary-600 text-sm font-medium'>Nota Média</Text>
          </View>

          <View className='w-px h-8 bg-primary-200' />

          <View className='items-center flex-1'>
            <Text className='text-2xl font-bold text-primary-700'>
              {Math.round((checkIns.filter((c) => c.wouldReturn).length / checkIns.length) * 100)}%
            </Text>
            <Text className='text-primary-600 text-sm font-medium'>Voltaria</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CheckInHistory;
