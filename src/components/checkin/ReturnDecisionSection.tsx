import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ReturnDecisionSectionProps {
  wouldReturn: boolean | null;
  onWouldReturnChange: (wouldReturn: boolean) => void;
}

const ReturnDecisionSection: React.FC<ReturnDecisionSectionProps> = ({
  wouldReturn,
  onWouldReturnChange,
}) => {
  const getRecommendationText = (): string => {
    if (wouldReturn === true) return 'Sim, recomendo este lugar! 👍';
    if (wouldReturn === false) return 'Não recomendo este lugar 👎';
    return 'Faça sua escolha para continuar';
  };

  const getRecommendationColor = (): string => {
    if (wouldReturn === true) return 'text-green-600';
    if (wouldReturn === false) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <View className='px-4 py-6'>
      <Text className='text-2xl font-bold text-gray-900 mb-2'>Voltaria aqui?</Text>
      <Text className='text-gray-600 mb-6'>
        Sua opinião ajuda outros usuários a descobrirem lugares incríveis
      </Text>
      
      {/* Current Selection Display */}
      <View className='mb-6 p-4 bg-gray-50 rounded-xl'>
        <Text className={`text-center font-medium ${getRecommendationColor()}`}>
          {getRecommendationText()}
        </Text>
      </View>
      
      {/* Options */}
      <View className='flex-col gap-2 space-y-4'>
        {/* Yes Option */}
        <TouchableOpacity
          onPress={() => onWouldReturnChange(true)}
          className={`p-4 rounded-xl flex-row items-center border-2 ${
            wouldReturn === true 
              ? 'bg-green-50 border-green-200' 
              : 'bg-white border-gray-200'
          }`}
        >
          <View className={`w-8 h-8 rounded-full border-2 mr-4 items-center justify-center ${
            wouldReturn === true 
              ? 'border-green-500 bg-green-500' 
              : 'border-gray-300 bg-white'
          }`}>
            {wouldReturn === true && (
              <Ionicons name='checkmark' size={20} color='white' />
            )}
          </View>
          
          <View className='flex-1'>
            <View className='flex-row items-center mb-1'>
              <Text className='text-lg font-semibold text-gray-900 mr-2'>
                Sim, voltaria!
              </Text>
              <Text className='text-2xl'>😍</Text>
            </View>
            <Text className='text-gray-600'>
              Gostei da experiência e recomendo para outros
            </Text>
          </View>
          
          {wouldReturn === true && (
            <View className='ml-2'>
              <Ionicons name='thumbs-up' size={24} color='#10B981' />
            </View>
          )}
        </TouchableOpacity>
        
        {/* No Option */}
        <TouchableOpacity
          onPress={() => onWouldReturnChange(false)}
          className={`p-4 rounded-xl flex-row items-center border-2 ${
            wouldReturn === false 
              ? 'bg-red-50 border-red-200' 
              : 'bg-white border-gray-200'
          }`}
        >
          <View className={`w-8 h-8 rounded-full border-2 mr-4 items-center justify-center ${
            wouldReturn === false 
              ? 'border-red-500 bg-red-500' 
              : 'border-gray-300 bg-white'
          }`}>
            {wouldReturn === false && (
              <Ionicons name='close' size={20} color='white' />
            )}
          </View>
          
          <View className='flex-1'>
            <View className='flex-row items-center mb-1'>
              <Text className='text-lg font-semibold text-gray-900 mr-2'>
                Não voltaria
              </Text>
              <Text className='text-2xl'>😕</Text>
            </View>
            <Text className='text-gray-600'>
              A experiência não atendeu minhas expectativas
            </Text>
          </View>
          
          {wouldReturn === false && (
            <View className='ml-2'>
              <Ionicons name='thumbs-down' size={24} color='#EF4444' />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Additional Context */}
      <View className='mt-6 p-4 bg-blue-50 rounded-xl'>
        <View className='flex-row items-start'>
          <Ionicons name='information-circle' size={20} color='#3B82F6' />
          <View className='ml-2 flex-1'>
            <Text className='text-blue-800 font-medium text-sm mb-1'>
              Por que isso é importante?
            </Text>
            <Text className='text-blue-700 text-sm'>
              Sua recomendação é valiosa para a comunidade Pinubi. Ela aparecerá no seu perfil e ajudará outros usuários nas suas decisões.
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Preview */}
      {wouldReturn !== null && (
        <View className='mt-4 p-3 bg-gray-50 rounded-xl'>
          <Text className='text-gray-700 text-sm text-center'>
            {wouldReturn 
              ? '✨ Mais uma recomendação positiva para este lugar!'
              : '💭 Sua opinião honesta ajuda a melhorar a qualidade das recomendações'
            }
          </Text>
        </View>
      )}
    </View>
  );
};

export default ReturnDecisionSection;
