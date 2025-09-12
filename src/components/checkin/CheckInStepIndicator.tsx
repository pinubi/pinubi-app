import React from 'react';
import { Text, View } from 'react-native';

interface CheckInStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: { title: string; description: string }[];
}

const CheckInStepIndicator: React.FC<CheckInStepIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps,
}) => {
  return (
    <View className='px-4 py-6 bg-white border-b border-gray-100'>
      {/* Progress Bar */}
      <View className='mb-4'>
        <View className='flex-row justify-between items-center mb-2'>
          <Text className='text-sm text-gray-500'>
            Etapa {currentStep} de {totalSteps}
          </Text>
          <Text className='text-sm text-primary-600 font-medium'>
            {Math.round((currentStep / totalSteps) * 100)}%
          </Text>
        </View>
        
        <View className='h-2 bg-gray-200 rounded-full overflow-hidden'>
          <View
            className='h-full bg-primary-500 rounded-full transition-all duration-300'
            style={{
              width: `${(currentStep / totalSteps) * 100}%`,
            }}
          />
        </View>
      </View>

      {/* Current Step Info */}
      {steps[currentStep - 1] && (
        <View>
          <Text className='text-lg font-bold text-gray-900 mb-1'>
            {steps[currentStep - 1].title}
          </Text>
          <Text className='text-gray-600'>
            {steps[currentStep - 1].description}
          </Text>
        </View>
      )}
    </View>
  );
};

export default CheckInStepIndicator;
