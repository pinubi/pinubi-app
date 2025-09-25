import { getReviewTypeDisplayName, getReviewTypeEmoji } from '@/utils/reviewUtils';
import { ReviewType } from '@pinubi/types';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ReviewTypeSectionProps {
  selectedType: ReviewType;
  onTypeChange: (type: ReviewType) => void;
  userReviewTypes?: ReviewType[]; // Types already reviewed by user
}

const REVIEW_TYPES: { type: ReviewType; description: string }[] = [
  { type: 'overall', description: 'Experiência geral' },
  { type: 'food', description: 'Qualidade da comida' },
  { type: 'drink', description: 'Bebidas e drinks' },
  { type: 'dessert', description: 'Sobremesas' },
  { type: 'service', description: 'Atendimento' },
  { type: 'ambiance', description: 'Ambiente e decoração' },
];

const ReviewTypeSection: React.FC<ReviewTypeSectionProps> = ({
  selectedType,
  onTypeChange,
  userReviewTypes = [],
}) => {
  const isTypeAlreadyReviewed = (type: ReviewType): boolean => {
    return userReviewTypes.includes(type);
  };

  return (
    <View className='px-4 py-6'>
      <Text className='text-2xl font-bold text-gray-900 mb-2'>Tipo de Avaliação</Text>
      <Text className='text-gray-600 mb-6'>
        Escolha o que você quer avaliar neste lugar
      </Text>

      <View className='space-y-3'>
        {REVIEW_TYPES.map((item) => {
          const isSelected = selectedType === item.type;
          const isAlreadyReviewed = isTypeAlreadyReviewed(item.type);
          const isDisabled = isAlreadyReviewed && !isSelected;

          return (
            <TouchableOpacity
              key={item.type}
              onPress={() => !isDisabled && onTypeChange(item.type)}
              disabled={isDisabled}
              className={`p-4 rounded-xl border-2 flex-row items-center ${
                isSelected
                  ? 'bg-primary-50 border-primary-500'
                  : isDisabled
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : 'bg-white border-gray-200'
              }`}
            >
              <View className='mr-3'>
                <Text className='text-2xl'>
                  {getReviewTypeEmoji(item.type)}
                </Text>
              </View>
              
              <View className='flex-1'>
                <View className='flex-row items-center'>
                  <Text className={`text-lg font-semibold ${
                    isSelected ? 'text-primary-700' : 'text-gray-900'
                  }`}>
                    {getReviewTypeDisplayName(item.type)}
                  </Text>
                  {isAlreadyReviewed && (
                    <View className='ml-2 px-2 py-1 bg-green-100 rounded-full'>
                      <Text className='text-green-700 text-xs font-medium'>
                        Já avaliado
                      </Text>
                    </View>
                  )}
                </View>
                <Text className={`text-sm ${
                  isSelected ? 'text-primary-600' : 'text-gray-600'
                }`}>
                  {item.description}
                </Text>
              </View>

              {isSelected && (
                <View className='w-6 h-6 bg-primary-500 rounded-full items-center justify-center'>
                  <Text className='text-white text-xs font-bold'>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {userReviewTypes.length > 0 && (
        <View className='mt-6 p-4 bg-blue-50 rounded-xl'>
          <Text className='text-blue-800 font-medium text-sm mb-1'>
            Avaliações já feitas ({userReviewTypes.length})
          </Text>
          <Text className='text-blue-700 text-sm'>
            Você pode criar uma nova avaliação para categorias ainda não avaliadas, ou editar suas avaliações existentes.
          </Text>
        </View>
      )}
    </View>
  );
};

export default ReviewTypeSection;
