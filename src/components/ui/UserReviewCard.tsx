import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { reviewService } from '@/services/reviewService';
import type { ReviewWithPlace } from '@/types/reviews';

interface UserReviewCardProps {
  review: ReviewWithPlace;
  compact?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const UserReviewCard: React.FC<UserReviewCardProps> = ({
  review,
  compact = false,
  onEdit,
  onDelete,
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'bg-green-100 text-green-800';
    if (rating >= 6) return 'bg-yellow-100 text-yellow-800';
    if (rating >= 4) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getReviewTypeIcon = (reviewType: string) => {
    const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      food: 'restaurant-outline',
      drink: 'wine-outline',
      dessert: 'ice-cream-outline',
      service: 'people-outline',
      ambiance: 'storefront-outline',
      overall: 'star-outline',
    };
    return iconMap[reviewType] || 'star-outline';
  };

  const getAddressString = (address: any): string => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address.formatted) return address.formatted;
    return '';
  };

  if (compact) {
    return (
      <View className='bg-gray-50 rounded-2xl p-3'>
        <View className='flex-row items-center justify-between mb-2'>
          <View className='flex-row items-center flex-1'>
            <Ionicons
              name={getReviewTypeIcon(review.reviewType)}
              size={16}
              color='#6b7280'
              style={{ marginRight: 8 }}
            />
            <Text className='text-gray-700 font-medium text-sm'>
              {reviewService.getReviewTypeDisplayName(review.reviewType)}
            </Text>
          </View>
          <View className={`px-2 py-1 rounded-full ${getRatingColor(review.rating)}`}>
            <Text className='text-xs font-semibold'>{reviewService.formatRating(review.rating)}</Text>
          </View>
        </View>

        {review.comment && (
          <Text className='text-gray-600 text-sm' numberOfLines={2}>
            {review.comment}
          </Text>
        )}

        <View className='flex-row items-center justify-between mt-2'>
          <Text className='text-gray-500 text-xs'>{formatDate(review.createdAt)}</Text>
          {review.wouldReturn && (
            <View className='flex-row items-center'>
              <Ionicons name='checkmark-circle' size={14} color='#10b981' />
              <Text className='text-green-600 text-xs ml-1'>Voltaria</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className='bg-white rounded-3xl p-4 mb-3 mx-4 shadow-sm border border-gray-100'>
      {/* Header with place info */}
      <View className='flex-row items-start mb-3'>
        <View className='flex-1'>
          <Text className='text-gray-900 font-bold text-lg mb-1'>
            {review.place?.name || 'Local sem nome'}
          </Text>
          {review.place?.address && (
            <Text className='text-gray-600 text-sm' numberOfLines={1}>
              {getAddressString(review.place.address)}
            </Text>
          )}
        </View>

        {review.place?.mainPhoto && (
          <Image
            source={{ uri: review.place.mainPhoto }}
            className='w-16 h-16 rounded-2xl ml-3'
            resizeMode='cover'
          />
        )}
      </View>

      {/* Review info */}
      <View className='flex-row items-center mb-3'>
        <View className='flex-row items-center flex-1'>
          <Ionicons
            name={getReviewTypeIcon(review.reviewType)}
            size={20}
            color='#6b7280'
            style={{ marginRight: 8 }}
          />
          <Text className='text-gray-700 font-medium'>
            {reviewService.getReviewTypeDisplayName(review.reviewType)}
          </Text>
        </View>

        <View className={`px-3 py-1 rounded-full ${getRatingColor(review.rating)}`}>
          <Text className='font-bold'>{reviewService.formatRating(review.rating)}</Text>
        </View>
      </View>

      {/* Comment */}
      {review.comment && (
        <Text className='text-gray-700 mb-3 leading-5'>{review.comment}</Text>
      )}

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <View className='flex-row mb-3 space-x-2'>
          {review.photos.slice(0, 3).map((photo, index) => (
            <Image
              key={index}
              source={{ uri: `data:${photo.mimeType};base64,${photo.base64}` }}
              className='w-20 h-20 rounded-xl'
              resizeMode='cover'
            />
          ))}
          {review.photos.length > 3 && (
            <View className='w-20 h-20 rounded-xl bg-gray-100 items-center justify-center'>
              <Text className='text-gray-600 font-semibold'>+{review.photos.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <View className='flex-row items-center justify-between pt-3 border-t border-gray-100'>
        <View className='flex-row gap-2 items-center space-x-4'>
          <View className='flex-row items-center'>
            <Ionicons
              name={review.isVisited ? 'location' : 'bookmark-outline'}
              size={16}
              color={review.isVisited ? '#10b981' : '#6b7280'}
            />
            <Text className={`ml-1 text-sm ${review.isVisited ? 'text-green-600' : 'text-gray-600'}`}>
              {review.isVisited ? 'Visitou' : 'Quer visitar'}
            </Text>
          </View>

          {review.wouldReturn && (
            <View className='flex-row items-center'>
              <Ionicons name='repeat-outline' size={16} color='#10b981' />
              <Text className='text-green-600 text-sm ml-1'>Voltaria</Text>
            </View>
          )}

          <View className='flex-row items-center'>
            <Ionicons name='time-outline' size={16} color='#6b7280' />
            <Text className='text-gray-600 text-sm ml-1'>{formatDate(review.createdAt)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View className='flex-row items-center space-x-2'>
          <TouchableOpacity
            onPress={onEdit}
            className='p-2 rounded-full bg-gray-50'
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name='create-outline' size={18} color='#6b7280' />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            className='p-2 rounded-full bg-red-50'
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name='trash-outline' size={18} color='#ef4444' />
          </TouchableOpacity>
        </View>
      </View>

      {/* Likes info */}
      {review.likes > 0 && (
        <View className='flex-row items-center mt-3 pt-3 border-t border-gray-100'>
          <Ionicons name='heart' size={16} color='#ef4444' />
          <Text className='text-gray-600 text-sm ml-1'>
            {review.likes} {review.likes === 1 ? 'curtida' : 'curtidas'}
          </Text>
        </View>
      )}
    </View>
  );
};
