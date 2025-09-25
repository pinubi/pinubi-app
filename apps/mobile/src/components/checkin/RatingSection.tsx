import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { ReviewType } from '@pinubi/types';

interface RatingSectionProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  reviewType: ReviewType;
  onReviewTypeChange: (reviewType: ReviewType) => void;
}

const RatingSection: React.FC<RatingSectionProps> = ({
  rating,
  onRatingChange,
  description,
  onDescriptionChange,
  reviewType,
  onReviewTypeChange,
}) => {
  // Debug log to check if component is rendering
  console.log('RatingSection rendering with rating:', rating, 'reviewType:', reviewType);

  const getReviewTypeDisplayName = (type: ReviewType): string => {
    const displayNames: { [key in ReviewType]: string } = {
      food: 'Comida',
      drink: 'Bebida',
      dessert: 'Sobremesa',
      service: 'Atendimento',
      ambiance: 'Ambiente',
      overall: 'Geral',
    };
    return displayNames[type];
  };

  const getReviewTypeEmoji = (type: ReviewType): string => {
    const emojis: { [key in ReviewType]: string } = {
      food: '🍽️',
      drink: '🍹',
      dessert: '🍰',
      service: '👨‍💼',
      ambiance: '🏛️',
      overall: '⭐',
    };
    return emojis[type];
  };

  const getRatingDescription = (rating: number): string => {
    if (rating >= 9) return 'Excepcional';
    if (rating >= 8) return 'Muito Bom';
    if (rating >= 7) return 'Bom';
    if (rating >= 6) return 'Regular';
    if (rating >= 5) return 'Médio';
    if (rating >= 4) return 'Fraco';
    if (rating >= 3) return 'Ruim';
    if (rating >= 2) return 'Muito Ruim';
    if (rating >= 1) return 'Péssimo';
    return 'Sem avaliação';
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 8) return '#10B981'; // Green
    if (rating >= 6) return '#F59E0B'; // Yellow
    if (rating >= 4) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getRatingEmoji = (rating: number): string => {
    if (rating >= 9) return '🤩';
    if (rating >= 8) return '😍';
    if (rating >= 7) return '😊';
    if (rating >= 6) return '🙂';
    if (rating >= 5) return '😐';
    if (rating >= 4) return '🙁';
    if (rating >= 3) return '😞';
    if (rating >= 2) return '😢';
    if (rating >= 1) return '😭';
    return '😶';
  };

  return (
    <View className='px-4 py-6'>
      {/* Rating Guidelines */}
      <View className='mb-6 p-4 bg-gray-50 rounded-xl'>
        <View className='flex-row items-start'>
          <Ionicons name='information-circle' size={20} color='#6B7280' />
          <View className='ml-2 flex-1'>
            <Text className='text-gray-700 font-medium text-sm mb-2'>Como avaliar?</Text>
            <View className='space-y-1'>
              <Text className='text-gray-600 text-sm'>• 9-10: Excepcional, superou expectativas</Text>
              <Text className='text-gray-600 text-sm'>• 7-8: Muito bom, recomendo</Text>
              <Text className='text-gray-600 text-sm'>• 5-6: OK, atende expectativas</Text>
              <Text className='text-gray-600 text-sm'>• 0-4: Abaixo das expectativas</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Review Type Selector */}
      <View className='mb-6'>
        <Text className='text-gray-900 font-medium mb-3'>Tipo de avaliação</Text>
        <View className='flex-row flex-wrap gap-2'>
          {(['overall', 'food', 'drink', 'dessert', 'service', 'ambiance'] as ReviewType[]).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => onReviewTypeChange(type)}
              className={`flex-row items-center px-3 py-2 rounded-full border ${
                reviewType === type ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <Text className='mr-1'>{getReviewTypeEmoji(type)}</Text>
              <Text className={`font-medium text-sm ${reviewType === type ? 'text-primary-700' : 'text-gray-700'}`}>
                {getReviewTypeDisplayName(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Rating Display */}
      <View className='items-center mb-6'>
        <Text className='text-6xl pt-2 mb-2'>{getRatingEmoji(rating)}</Text>
        <Text className='text-4xl font-bold mb-2' style={{ color: getRatingColor(rating) }}>
          {rating.toFixed(1)}
        </Text>
        <Text className='text-lg font-medium mb-4' style={{ color: getRatingColor(rating) }}>
          {getRatingDescription(rating)}
        </Text>
      </View>

      {/* Rating Slider */}
      <View className='mb-6'>
        <View className='flex-row justify-between items-center mb-3'>
          <Text className='text-gray-600 font-medium'>Nota geral</Text>
          <View className='flex-row items-center'>
            <Ionicons name='star' size={20} color='#FBBF24' />
            <Text className='text-gray-900 font-semibold ml-1'>{rating.toFixed(1)}/10</Text>
          </View>
        </View>

        <View className='px-4 py-4 bg-gray-50 rounded-xl'>
          <Text className='text-gray-500 text-sm mb-2'>Deslize para ajustar a nota:</Text>
          <Slider
            minimumValue={0}
            maximumValue={10}
            value={rating}
            onValueChange={(value) => {
              console.log('Slider value changed:', value);
              onRatingChange(value);
            }}
            step={0.1}
            minimumTrackTintColor={getRatingColor(rating)}
            maximumTrackTintColor='#E5E7EB'
            thumbTintColor={getRatingColor(rating)}
            style={{
              width: '100%',
              height: 50,
            }}
          />
          <Text className='text-gray-500 text-xs mt-1 text-center'>Toque e arraste o controle deslizante</Text>
        </View>

        <View className='flex-row justify-between mt-2 px-2'>
          <Text className='text-gray-400 text-sm'>0</Text>
          <Text className='text-gray-400 text-sm'>5</Text>
          <Text className='text-gray-400 text-sm'>10</Text>
        </View>
      </View>

      {/* Quick Rating Buttons */}
      <View className='mb-6'>
        <Text className='text-gray-600 font-medium mb-3'>Avaliação rápida</Text>
        <View className='flex-row flex-wrap gap-2 mb-3'>
          {[5, 6, 7, 8, 9, 10].map((quickRating) => (
            <TouchableOpacity
              key={quickRating}
              onPress={() => onRatingChange(quickRating)}
              className={`px-4 py-2 rounded-full border ${
                rating === quickRating ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <Text className={`font-medium ${rating === quickRating ? 'text-primary-700' : 'text-gray-700'}`}>
                {quickRating}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Description Input */}
      <View>
        <Text className='text-gray-900 font-medium mb-3'>Descrição (opcional)</Text>
        <TextInput
          value={description}
          onChangeText={onDescriptionChange}
          placeholder='Conte como foi sua experiência...'
          placeholderTextColor='#9CA3AF'
          className='bg-gray-50 rounded-xl p-4 h-24 text-gray-900 text-base'
          multiline
          textAlignVertical='top'
          maxLength={500}
        />
        <Text className='text-gray-400 text-sm mt-2 text-right'>{description.length}/500 caracteres</Text>
      </View>
    </View>
  );
};

export default RatingSection;
