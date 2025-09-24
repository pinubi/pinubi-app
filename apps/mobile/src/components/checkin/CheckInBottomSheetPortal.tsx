import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCheckInsStore } from '@/store/checkInsStore';
import type { CheckInFormData } from '@/types/checkins';
import type { Place } from '@/types/places';
import CheckInStepIndicator from './CheckInStepIndicator';
import DatePickerSection from './DatePickerSection';
import PhotoUploadSection from './PhotoUploadSection';
import RatingSection from './RatingSection';
import ReturnDecisionSection from './ReturnDecisionSection';

export type CheckInBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
  close: () => void;
};

interface CheckInBottomSheetPortalProps {
  place: Place | null;
  onClose?: () => void;
  onCheckInComplete?: (place: Place) => void;
}

const { width, height } = Dimensions.get('window');

const STEPS = [
  {
    title: 'Adicionar Fotos',
    description: 'Compartilhe momentos da sua experiência (opcional)',
  },
  {
    title: 'Data da Visita',
    description: 'Confirme quando você esteve aqui',
  },
  {
    title: 'Sua Avaliação',
    description: 'Como foi sua experiência neste lugar?',
  },
  {
    title: 'Recomendação',
    description: 'Você voltaria e recomendaria este lugar?',
  },
];

const CheckInBottomSheetPortal = forwardRef<CheckInBottomSheetRef, CheckInBottomSheetPortalProps>(
  ({ place, onClose, onCheckInComplete }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const insets = useSafeAreaInsets();

    const {
      currentCheckIn,
      loading,
      error,
      startCheckIn,
      updateCheckInStep,
      updateFormData,
      createCheckIn,
      completeCheckIn,
      cancelCheckIn,
      clearError,
    } = useCheckInsStore();

    // Use store formData directly with proper defaults
    const formData: CheckInFormData = {
      visitDate: currentCheckIn.formData.visitDate || new Date(),
      rating: currentCheckIn.formData.rating ?? 5.0,
      reviewType: currentCheckIn.formData.reviewType || 'overall',
      description: currentCheckIn.formData.description || '',
      wouldReturn: currentCheckIn.formData.wouldReturn ?? null,
      photos: currentCheckIn.formData.photos || [],
    };

    // Helper function to update specific fields
    const updateFormField = <K extends keyof CheckInFormData>(field: K, value: CheckInFormData[K]) => {
      updateFormData({ [field]: value } as Partial<CheckInFormData>);
    };

    // Clear errors when they occur
    useEffect(() => {
      if (error) {
        Alert.alert('Erro', error, [{ text: 'OK', onPress: clearError }]);
      }
    }, [error, clearError]);

    // Expose methods to parent component
    React.useImperativeHandle(ref, () => ({
      present: () => {
        showBottomSheet();
      },
      dismiss: () => {
        hideBottomSheet();
      },
      close: () => {
        hideBottomSheet();
      },
    }));

    const showBottomSheet = () => {
      if (!place) return;

      setIsVisible(true);
      startCheckIn(place.id);
    };

    const hideBottomSheet = () => {
      setIsVisible(false);
      cancelCheckIn();
      onClose?.();
    };

    const handleNext = () => {
      if (currentCheckIn.currentStep < currentCheckIn.totalSteps) {
        updateCheckInStep(currentCheckIn.currentStep + 1);
      } else {
        handleComplete();
      }
    };

    const handleBack = () => {
      if (currentCheckIn.currentStep > 1) {
        updateCheckInStep(currentCheckIn.currentStep - 1);
      } else {
        handleCancel();
      }
    };

    const handleCancel = () => {
      Alert.alert('Cancelar Check-in', 'Tem certeza de que deseja cancelar? Todos os dados serão perdidos.', [
        { text: 'Continuar editando', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: hideBottomSheet,
        },
      ]);
    };

    const handleComplete = async () => {
      if (!place) return;

      // Final validation before sending to Firebase
      const requiredFields: (keyof CheckInFormData)[] = ['visitDate', 'rating', 'reviewType', 'wouldReturn'];
      const missingFields = requiredFields.filter((field) => {
        const value = formData[field];
        if (field === 'wouldReturn') return value === null || value === undefined;
        if (field === 'rating') {
          const rating = value as number;
          return rating === undefined || rating === null || rating < 0 || rating > 10;
        }
        return !value;
      });

      if (missingFields.length > 0) {
        Alert.alert(
          'Dados Incompletos',
          `Por favor, preencha os seguintes campos: ${missingFields
            .map((field) => {
              switch (field) {
                case 'visitDate':
                  return 'Data da visita';
                case 'rating':
                  return 'Avaliação';
                case 'reviewType':
                  return 'Tipo de avaliação';
                case 'wouldReturn':
                  return 'Recomendação';
                default:
                  return field;
              }
            })
            .join(', ')}`,
          [{ text: 'OK' }]
        );
        return;
      }

      try {
        await createCheckIn(place.id, formData);
        completeCheckIn();
        setIsVisible(false);
        onCheckInComplete?.(place);

        Alert.alert('Check-in Realizado! 🎉', 'Sua experiência foi salva com sucesso.', [{ text: 'OK' }]);
      } catch (error) {
        console.error('Error completing check-in:', error);
      }
    };

    const canProceed = (): boolean => {
      switch (currentCheckIn.currentStep) {
        case 1: // Photos - always optional
          return true;
        case 2: // Date - required
          return !!formData.visitDate;
        case 3: // Rating and Review Type - required
          return formData.rating >= 0 && formData.rating <= 10 && !!formData.reviewType;
        case 4: // Return decision - required
          return formData.wouldReturn !== null;
        default:
          return false;
      }
    };

    const renderStepContent = () => {
      switch (currentCheckIn.currentStep) {
        case 1:
          return (
            <PhotoUploadSection
              photos={formData.photos}
              onPhotosChange={(photos) => updateFormField('photos', photos)}
            />
          );
        case 2:
          return (
            <DatePickerSection
              selectedDate={formData.visitDate}
              onDateChange={(visitDate) => updateFormField('visitDate', visitDate)}
            />
          );
        case 3:
          return (
            <RatingSection
              rating={formData.rating}
              onRatingChange={(rating) => updateFormField('rating', rating)}
              description={formData.description}
              onDescriptionChange={(description) => updateFormField('description', description)}
              reviewType={formData.reviewType}
              onReviewTypeChange={(reviewType) => updateFormField('reviewType', reviewType)}
            />
          );
        case 4:
          return (
            <ReturnDecisionSection
              wouldReturn={formData.wouldReturn}
              onWouldReturnChange={(wouldReturn) => updateFormField('wouldReturn', wouldReturn)}
            />
          );
        default:
          return null;
      }
    };

    const renderNavigationButtons = () => {
      const isLastStep = currentCheckIn.currentStep === currentCheckIn.totalSteps;
      const isFirstStep = currentCheckIn.currentStep === 1;

      return (
        <View className='flex-row items-center justify-between px-4 py-4 bg-white border-t border-gray-100'>
          {/* Back/Cancel Button */}
          <TouchableOpacity onPress={handleBack} className='flex-row items-center px-4 py-3'>
            <Ionicons name={isFirstStep ? 'close' : 'arrow-back'} size={20} color='#6B7280' />
            <Text className='text-gray-600 font-medium ml-2'>{isFirstStep ? 'Cancelar' : 'Voltar'}</Text>
          </TouchableOpacity>

          {/* Next/Complete Button */}
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canProceed() || loading}
            className={`flex-row items-center px-6 py-3 rounded-xl ${
              canProceed() && !loading ? 'bg-primary-500' : 'bg-gray-300'
            }`}
          >
            {loading ? (
              <Text className='text-white font-semibold'>Salvando...</Text>
            ) : (
              <>
                <Text className='text-white font-semibold mr-2'>{isLastStep ? 'Finalizar' : 'Próximo'}</Text>
                <Ionicons name={isLastStep ? 'checkmark' : 'arrow-forward'} size={20} color='white' />
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <Modal visible={isVisible} animationType='slide' presentationStyle='fullScreen' onRequestClose={hideBottomSheet}>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', height, width }}>
          {place && (
            <>
              {/* Header */}
              <View style={{ paddingTop: insets.top }} className='bg-white border-b border-gray-100'>
                <View className='px-4 py-4'>
                  <Text className='text-lg font-bold text-gray-900 mb-1'>Check-in em {place.googleData.name}</Text>
                  <Text className='text-gray-600'>Compartilhe sua experiência</Text>
                </View>
              </View>

              {/* Step Indicator */}
              <CheckInStepIndicator
                currentStep={currentCheckIn.currentStep}
                totalSteps={currentCheckIn.totalSteps}
                steps={STEPS}
              />

              {/* Content */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps='handled'
              >
                {renderStepContent()}
              </ScrollView>

              {/* Navigation */}
              <View style={{ paddingBottom: insets.bottom }}>{renderNavigationButtons()}</View>
            </>
          )}
        </View>
      </Modal>
    );
  }
);

CheckInBottomSheetPortal.displayName = 'CheckInBottomSheetPortal';

export default CheckInBottomSheetPortal;
