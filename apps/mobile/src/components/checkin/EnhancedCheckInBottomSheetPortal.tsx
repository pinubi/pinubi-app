import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUserPlaceReviews } from '@/hooks/useReviews';
import { useCheckInsStore } from '@/store/enhancedCheckInsStore';
import type { CheckInFormData } from '@/types/checkins';

import type { ReviewType } from '@pinubi/types';

import { Place } from '@pinubi/types';
import CheckInStepIndicator from './CheckInStepIndicator';
import DatePickerSection from './DatePickerSection';
import PhotoUploadSection from './PhotoUploadSection';
import RatingSection from './RatingSection';
import ReturnDecisionSection from './ReturnDecisionSection';
import ReviewTypeSection from './ReviewTypeSection';

export type CheckInBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
  close: () => void;
};

interface CheckInBottomSheetPortalProps {
  place: Place | null;
  userId?: string;
  initialReviewType?: ReviewType;
  onClose?: () => void;
  onCheckInComplete?: (place: Place) => void;
}

const { width, height } = Dimensions.get('window');

const STEPS = [
  {
    title: 'Tipo de Avaliação',
    description: 'Escolha o que você quer avaliar',
  },
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

const EnhancedCheckInBottomSheetPortal = forwardRef<CheckInBottomSheetRef, CheckInBottomSheetPortalProps>(
  ({ place, userId = 'current-user', initialReviewType = 'overall', onClose, onCheckInComplete }, ref) => {
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
      getUserReviewTypes,
      loadUserReviewTypes,
    } = useCheckInsStore();

    // Get user's existing reviews for this place
    const { 
      reviews: userReviews,
      hasReviewForType,
      refreshReviews 
    } = useUserPlaceReviews(userId, place?.id || '');

    // Use store formData directly with proper defaults
    const formData: CheckInFormData = {
      visitDate: currentCheckIn.formData.visitDate || new Date(),
      rating: currentCheckIn.formData.rating ?? 8.0,
      reviewType: currentCheckIn.formData.reviewType || initialReviewType,
      description: currentCheckIn.formData.description || '',
      wouldReturn: currentCheckIn.formData.wouldReturn ?? null,
      photos: currentCheckIn.formData.photos || [],
    };

    // Helper function to update specific fields
    const updateFormField = <K extends keyof CheckInFormData>(
      field: K, 
      value: CheckInFormData[K]
    ) => {
      updateFormData({ ...formData, [field]: value });
    };

    // Clear errors when they occur
    useEffect(() => {
      if (error) {
        Alert.alert('Erro', error, [
          { text: 'OK', onPress: clearError }
        ]);
      }
    }, [error, clearError]);

    // Load user's existing review types when place changes
    useEffect(() => {
      if (place?.id && userId) {
        loadUserReviewTypes(place.id, userId);
      }
    }, [place?.id, userId, loadUserReviewTypes]);

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
      startCheckIn(place.id, initialReviewType);
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
      Alert.alert(
        'Cancelar Avaliação',
        'Tem certeza de que deseja cancelar? Todos os dados serão perdidos.',
        [
          { text: 'Continuar editando', style: 'cancel' },
          { 
            text: 'Sim, cancelar', 
            style: 'destructive',
            onPress: hideBottomSheet 
          },
        ]
      );
    };

    const handleComplete = async () => {
      if (!place) return;

      try {
        await createCheckIn(place.id, formData);
        completeCheckIn();
        setIsVisible(false);
        
        // Refresh user reviews to update the UI
        refreshReviews();
        
        onCheckInComplete?.(place);
        
        Alert.alert(
          'Avaliação Criada! 🎉',
          'Sua experiência foi salva com sucesso.',
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Error completing check-in:', error);
        // Error is already handled by the store
      }
    };

    const canProceed = (): boolean => {
      switch (currentCheckIn.currentStep) {
        case 1: // Review type - required, and can't be one already reviewed
          return !!formData.reviewType && !hasReviewForType(formData.reviewType);
        case 2: // Photos - always optional
          return true;
        case 3: // Date - required
          return !!formData.visitDate;
        case 4: // Rating - required
          return formData.rating >= 0 && formData.rating <= 10;
        case 5: // Return decision - required
          return formData.wouldReturn !== null;
        default:
          return false;
      }
    };

    const renderStepContent = () => {
      switch (currentCheckIn.currentStep) {
        case 1:
          return (
            <ReviewTypeSection
              selectedType={formData.reviewType}
              onTypeChange={(reviewType) => updateFormField('reviewType', reviewType)}
              userReviewTypes={userReviews.map(r => r.reviewType)}
            />
          );
        case 2:
          return (
            <PhotoUploadSection
              photos={formData.photos}
              onPhotosChange={(photos) => updateFormField('photos', photos)}
            />
          );
        case 3:
          return (
            <DatePickerSection
              selectedDate={formData.visitDate}
              onDateChange={(visitDate) => updateFormField('visitDate', visitDate)}
            />
          );
        case 4:
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
        case 5:
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
      const canMoveForward = canProceed();

      return (
        <View className='flex-row items-center justify-between px-4 py-4 bg-white border-t border-gray-100'>
          {/* Back/Cancel Button */}
          <TouchableOpacity
            onPress={handleBack}
            className='flex-row items-center px-4 py-3'
          >
            <Ionicons 
              name={isFirstStep ? 'close' : 'arrow-back'} 
              size={20} 
              color='#6B7280' 
            />
            <Text className='text-gray-600 font-medium ml-2'>
              {isFirstStep ? 'Cancelar' : 'Voltar'}
            </Text>
          </TouchableOpacity>

          {/* Step indicator */}
          <View className='flex-row items-center'>
            <Text className='text-gray-500 text-sm'>
              {currentCheckIn.currentStep} de {currentCheckIn.totalSteps}
            </Text>
          </View>

          {/* Next/Complete Button */}
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canMoveForward || loading}
            className={`flex-row items-center px-6 py-3 rounded-xl ${
              canMoveForward && !loading
                ? 'bg-primary-500'
                : 'bg-gray-300'
            }`}
          >
            {loading ? (
              <Text className='text-white font-semibold'>Salvando...</Text>
            ) : (
              <>
                <Text className='text-white font-semibold mr-2'>
                  {isLastStep ? 'Finalizar' : 'Próximo'}
                </Text>
                <Ionicons 
                  name={isLastStep ? 'checkmark' : 'arrow-forward'} 
                  size={20} 
                  color='white' 
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={hideBottomSheet}
      >
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', height, width }}>
          {place && (
            <>
              {/* Header */}
              <View style={{ paddingTop: insets.top }} className='bg-white border-b border-gray-100'>
                <View className='px-4 py-4'>
                  <Text className='text-lg font-bold text-gray-900 mb-1'>
                    Avaliar {place.googleData.name}
                  </Text>
                  <Text className='text-gray-600'>
                    Compartilhe sua experiência
                  </Text>
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
                keyboardShouldPersistTaps="handled"
              >
                {renderStepContent()}
              </ScrollView>

              {/* Navigation */}
              <View style={{ paddingBottom: insets.bottom }}>
                {renderNavigationButtons()}
              </View>
            </>
          )}
        </View>
      </Modal>
    );
  }
);

EnhancedCheckInBottomSheetPortal.displayName = 'EnhancedCheckInBottomSheetPortal';

export default EnhancedCheckInBottomSheetPortal;
