import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';

import { googlePlacesService } from '@/services/googlePlacesService';
import { Place } from '@/types/places';
import { usePortal } from './PortalProvider';

export type BottomSheetRef = BottomSheet;

interface PlaceDetailsBottomSheetPortalProps {
  place: Place | null;
  onClose?: () => void;
  onSavePlace?: (place: Place) => void;
  onReserveTable?: (place: Place) => void;
  onShowOnMap?: (place: Place) => void;
}

interface ReviewData {
  id: string;
  author: string;
  rating: number;
  comment: string;
  timeAgo: string;
  avatar?: string;
}

const { width } = Dimensions.get('window');

// Separate component for photo scrolling to isolate state
const PhotoScrollComponent = ({ photos }: { photos: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    console.log('🔵 PhotoScrollComponent - currentIndex changed to:', currentIndex);
  }, [currentIndex]);

  const hasPhotos = photos.length > 0;

  return (
    <View className='relative'>
      {hasPhotos ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate="fast"
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            console.log('🔵 PhotoScrollComponent onScroll - calculated index:', index, 'contentOffset:', event.nativeEvent.contentOffset.x);
            
            if (index >= 0 && index < photos.length && index !== currentIndex) {
              console.log('🔵 PhotoScrollComponent onScroll - UPDATING INDEX to:', index);
              setCurrentIndex(index);
            }
          }}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            console.log('🔵 PhotoScrollComponent onMomentumScrollEnd - calculated index:', index);
            
            if (index >= 0 && index < photos.length) {
              setCurrentIndex(index);
            }
          }}
        >
          {photos.map((photo, index) => (
            <Image
              key={index}
              source={{
                uri:
                  googlePlacesService.getPhotoUri(photo) ||
                  'https://via.placeholder.com/64x64/8B4513/FFFFFF?text=🍽️',
              }}
              className='w-full h-72'
              style={{ width }}
              resizeMode='cover'
            />
          ))}
        </ScrollView>
      ) : (
        <View className='w-full h-72 bg-gray-200 items-center justify-center'>
          <Ionicons name='image-outline' size={48} color='#9CA3AF' />
          <Text className='text-gray-500 mt-2'>Sem fotos disponíveis</Text>
        </View>
      )}

      {/* Photo indicator */}
      {hasPhotos && photos.length > 1 && (
        <View className='absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded-full'>
          <Text className='text-white text-sm'>
            {currentIndex + 1}/{photos.length}
          </Text>
        </View>
      )}
    </View>
  );
};

const PlaceDetailsBottomSheetPortal = forwardRef<BottomSheetRef, PlaceDetailsBottomSheetPortalProps>(
  ({ place, onClose, onSavePlace, onReserveTable, onShowOnMap }, ref) => {
    const { showPortal, hidePortal } = usePortal();
    const bottomSheetRef = useRef<BottomSheetRef>(null);
    const photoScrollViewRef = useRef<ScrollView>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const snapPoints = useMemo(() => ['100%'], []);

    // Automatically show bottom sheet when place is set
    useEffect(() => {
      if (place) {
        console.log('🔵 Place changed, showing bottom sheet:', place.googleData.name);
        console.log('🔵 Place data structure:', JSON.stringify(place, null, 2));
        // Reset photo index when place changes
        setCurrentPhotoIndex(0);
        showBottomSheet();
      } else {
        console.log('🔵 Place cleared, hiding bottom sheet');
        hideBottomSheet();
      }
    }, [place]);

    // Debug effect to track currentPhotoIndex changes
    useEffect(() => {
      console.log('🔵 currentPhotoIndex changed to:', currentPhotoIndex);
    }, [currentPhotoIndex]);

    // Mock reviews data - replace with real data
    const mockReviews: ReviewData[] = [
      {
        id: '1',
        author: 'Maria Silva',
        rating: 5,
        comment:
          'Hambúrguer incrível! O molho especial é sensacional e a carne no ponto perfeito. Ambiente descontraído e atendimento nota 10.',
        timeAgo: 'há 2 dias',
      },
      {
        id: '2',
        author: 'João Santos',
        rating: 4,
        comment:
          'Muito bom! As batatas são crocantes e o hambúrguer bem saboroso. Só achei um pouco demorado para ficar pronto.',
        timeAgo: 'há 1 semana',
      },
      {
        id: '3',
        author: 'Ana Costa',
        rating: 5,
        comment: 'Melhor hambúrguer da região! Ingredientes frescos e muito sabor. Recomendo o combo com batata doce.',
        timeAgo: 'há 2 semanas',
      },
    ];

    // Expose methods to parent component
    React.useImperativeHandle(ref, () => ({
      snapToIndex: (index: number) => {
        console.log('🔵 PlaceDetailsBottomSheetPortal snapToIndex called:', { index, hasPlace: !!place });
        if (index >= 0) {
          showBottomSheet();
        } else {
          hideBottomSheet();
        }
      },
      close: () => {
        console.log('🔵 PlaceDetailsBottomSheetPortal close called');
        hideBottomSheet();
      },
      collapse: () => hideBottomSheet(),
      expand: () => showBottomSheet(),
      snapToPosition: () => showBottomSheet(),
      forceClose: () => hideBottomSheet(),
    }));

    const handleSheetChanges = useCallback(
      (index: number) => {
        console.log('PlaceDetailsBottomSheet index changed to:', index);
        if (index === -1) {
          hideBottomSheet();
          onClose?.();
        }
      },
      [onClose]
    );

    const showBottomSheet = () => {
      console.log('🔵 showBottomSheet called:', { hasPlace: !!place, placeName: place?.googleData.name });
      if (!place || !place.googleData) {
        console.log('🔴 Cannot show bottom sheet: no place data or googleData');
        return;
      }

      const bottomSheetContent = (
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          onChange={handleSheetChanges}
          enableOverDrag={false}
          keyboardBehavior='interactive'
          keyboardBlurBehavior='restore'
          style={{
            zIndex: 1002,
            elevation: 1002,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
          }}
          backgroundStyle={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
          handleStyle={{
            display: 'none',
          }}
          handleIndicatorStyle={{
            display: 'none',
          }}
        >
          {/* Header Image - Outside of BottomSheetScrollView to avoid conflicts */}
          {renderHeaderImage()}
          
          <BottomSheetScrollView 
            style={{ flex: 1, backgroundColor: 'white' }}
            contentContainerStyle={{ paddingTop: 0 }}
          >
            {/* Place Info */}
            {renderPlaceInfo()}

            {/* Tags */}
            {renderTags()}

            {/* Info Cards */}
            {renderInfoCards()}

            {/* Rating Score */}
            {renderRatingScore()}

            {/* Pinubi Review */}
            {/* {renderPinubiReview()} */}

            {/* Community Reviews */}
            {renderCommunityReviews()}

            {/* Fixed Bottom Actions */}
            {/* {renderBottomActions()} */}
          </BottomSheetScrollView>
        </BottomSheet>
      );

      showPortal(bottomSheetContent, 'place-details-bottom-sheet');
    };

    const hideBottomSheet = () => {
      hidePortal('place-details-bottom-sheet');
    };

    const renderHeaderImage = () => {
      const photos = place?.googleData.photos || [];

      console.log('🔵 renderHeaderImage - photos count:', photos.length);

      return (
        <View className='relative'>
          <PhotoScrollComponent photos={photos} />

          {/* Header Actions */}
          <View className='absolute top-14 left-4 right-4 flex-row justify-between'>
            <TouchableOpacity
              onPress={hideBottomSheet}
              className='w-10 h-10 bg-white/90 rounded-full items-center justify-center'
            >
              <Ionicons name='arrow-back' size={20} color='#1F2937' />
            </TouchableOpacity>

            <View className='flex-row gap-2 space-x-3'>
              <TouchableOpacity
                onPress={handleShare}
                className='w-10 h-10 bg-white/90 rounded-full items-center justify-center'
              >
                <Ionicons name='share-outline' size={20} color='#1F2937' />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                className='w-10 h-10 bg-white/90 rounded-full items-center justify-center'
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={isSaved ? '#9333EA' : '#1F2937'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    };

    const renderPlaceInfo = () => (
      <View className='px-4 py-4'>
        <Text className='text-2xl font-bold text-gray-900 mb-2'>{place?.googleData.name || 'Local sem nome'}</Text>

        <Text className='text-gray-600 text-base mb-3'>
          $$ • {getPlaceType()} • {getLocationText()}
        </Text>
      </View>
    );

    const renderTags = () => (
      <View className='px-4 pb-4'>
        <View className='flex-row gap-2 space-x-2'>
          <View className='bg-primary-500 px-3 py-1 rounded-full flex-row items-center'>
            <Text className='text-white text-sm font-medium'>😋 Prato Especial</Text>
          </View>
          <View className='bg-amber-500 px-3 py-1 rounded-full flex-row items-center'>
            <Text className='text-white text-sm font-medium'>👍 Ótimo Sabor</Text>
          </View>
        </View>
      </View>
    );

    const renderInfoCards = () => (
      <View className='px-4 pb-6'>
        <Text className='text-xl font-bold text-gray-900 mb-4'>Informações</Text>

        <View className='flex-col gap-2 space-y-4'>
          {/* Address */}
          <View className='flex-row items-center'>
            <View className='w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3'>
              <Ionicons name='location-outline' size={16} color='#6B7280' />
            </View>
            <View className='flex-1'>
              <Text className='text-gray-900 font-medium'>{getAddressString(place?.googleData.address)}</Text>
              <Text className='text-gray-600 text-sm'>0,5 km de distância</Text>
            </View>
          </View>

          {/* Opening Hours */}
          <View className='flex-row items-center'>
            <View className='w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3'>
              <Ionicons name='time-outline' size={16} color='#6B7280' />
            </View>
            <View className='flex-1'>
              <Text className='text-gray-900 font-medium'>{place?.googleData.openingHours?.openNow ?  'Aberto agora' : 'Fechado'}</Text>
              <Text className='text-gray-600 text-sm'>{`${place?.googleData.openingHours?.weekdayText?.join(', \n') || 'Horários não disponíveis'}`}</Text>
            </View>
          </View>

          {/* Group size */}
          {/* <View className='flex-row items-center'>
            <View className='w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3'>
              <Ionicons name='people-outline' size={16} color='#6B7280' />
            </View>
            <View className='flex-1'>
              <Text className='text-gray-900 font-medium'>Grupos bem-vindos</Text>
              <Text className='text-gray-600 text-sm'>Aceita reservas para até 8 pessoas</Text>
            </View>
          </View> */}

          {/* Amenities */}
          <View className='flex-row gap-2 items-center space-x-4 pt-2'>
            <View className='flex-row items-center'>
              <Ionicons name='wifi' size={16} color='#6B7280' />
              <Text className='text-gray-600 text-sm ml-1'>Wi-Fi</Text>
            </View>
            <View className='flex-row items-center'>
              <Ionicons name='card-outline' size={16} color='#6B7280' />
              <Text className='text-gray-600 text-sm ml-1'>Cartão</Text>
            </View>
          </View>
        </View>
      </View>
    );

    const renderRatingScore = () => (
      <View className='px-4 pb-6'>
        <Text className='text-xl font-bold text-gray-900 mb-4'>EXPERIÊNCIA GASTRONÔMICA</Text>

        <View className='flex-row items-center'>
          {/* Overall Score */}
          <View className='bg-primary-500 rounded-2xl p-4 mr-4 items-center justify-center w-20 h-20'>
            <Text className='text-white text-2xl font-bold'>{place?.googleData.rating?.toFixed(1) || '4.6'}</Text>
            {/* <Text className='text-white text-xs'>EXCELENTE</Text> */}
          </View>

          {/* Category Scores */}
          <View className='flex-1 flex-row gap-2 space-y-3'>
            <View className='flex-row items-center justify-between'>
              <View className='flex-row items-center'>
                <Text className='text-2xl mr-2'>🍔</Text>
                <View>
                  <Text className='text-gray-900 font-medium'>Comida</Text>
                  <Text className='text-primary-500 text-sm font-medium'>Excelente</Text>
                </View>
              </View>
            </View>

            <View className='flex-row items-center justify-between'>
              <View className='flex-row items-center'>
                <Text className='text-2xl mr-2'>✨</Text>
                <View>
                  <Text className='text-gray-900 font-medium'>Ambiente</Text>
                  <Text className='text-primary-500 text-sm font-medium'>Muito Bom</Text>
                </View>
              </View>
            </View>

            <View className='flex-row items-center justify-between'>
              <View className='flex-row items-center'>
                <Text className='text-2xl mr-2'>🎯</Text>
                <View>
                  <Text className='text-gray-900 font-medium'>Serviço</Text>
                  <Text className='text-primary-500 text-sm font-medium'>Excelente</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <Text className='text-gray-600 text-sm mt-3'>
          * Pinubi Score baseado em {place?.googleData.userRatingsTotal || 50} avaliações
        </Text>
      </View>
    );

    const renderPinubiReview = () => (
      <View className='px-4 pb-6'>
        <Text className='text-xl font-bold text-gray-900 mb-4'>Pinubi Review</Text>

        <Text className='text-gray-700 text-base leading-relaxed mb-4'>
          O {place?.googleData.name || 'local'} se destaca por seus hambúrgueres artesanais criativos, ambiente
          descontraído e amigável, e excelente atendimento. No entanto, pode haver algumas limitações quando se trata de
          acomodar grupos maiores durante horários de pico.
        </Text>

        <TouchableOpacity className='bg-gray-900 rounded-xl py-3 items-center'>
          <Text className='text-white font-medium'>Ler review completa do Pinubi</Text>
        </TouchableOpacity>
      </View>
    );

    const renderCommunityReviews = () => (
      <View className='px-4 pb-6'>
        <View className='flex-row items-center justify-between mb-4'>
          <Text className='text-xl font-bold text-gray-900'>Avaliações da comunidade</Text>
          <TouchableOpacity
            className='bg-primary-500 px-4 py-2 rounded-full flex-row items-center'
            onPress={handleReview}
          >
            <Ionicons name='create-outline' size={16} color='white' />
            <Text className='text-white font-medium ml-1'>Avaliar</Text>
          </TouchableOpacity>
        </View>

        <Text className='text-gray-600 text-sm mb-4'>{mockReviews.length} avaliações públicas</Text>

        <View className='space-y-4'>
          {mockReviews.map((review) => (
            <View key={review.id} className='mb-2 border-b border-gray-200 pt-4 pb-4 last:border-b-0'>
              <View className='flex-row items-center mb-2'>
                <View className='w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-3'>
                  <Ionicons name='person' size={20} color='#6B7280' />
                </View>
                <View className='flex-1'>
                  <Text className='text-gray-900 font-semibold'>{review.author}</Text>
                  <Text className='text-gray-600 text-sm'>{review.timeAgo}</Text>
                </View>
              </View>

              <View className='flex-row items-center mb-2'>
                {[...Array(5)].map((_, i) => (
                  <Ionicons key={i} name='star' size={16} color={i < review.rating ? '#FBBF24' : '#E5E7EB'} />
                ))}
              </View>

              <Text className='text-gray-700 leading-relaxed'>{review.comment}</Text>

              <View className='flex-row gap-2 items-center mt-3 space-x-4'>
                <TouchableOpacity className='flex-row items-center'>
                  <Ionicons name='thumbs-up-outline' size={16} color='#6B7280' />
                  <Text className='text-gray-600 text-sm ml-1'>12</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text className='text-gray-600 text-sm'>Responder</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
    );

    const renderBottomActions = () => (
      <View className='absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4'>
        <View className='flex-row space-x-3'>
          <TouchableOpacity
            onPress={handleSave}
            className='w-12 h-12 bg-gray-100 rounded-full items-center justify-center'
          >
            <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={24} color={isSaved ? '#DC2626' : '#6B7280'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleReserveTable}
            className='flex-1 bg-primary-500 rounded-full py-4 items-center justify-center'
          >
            <Text className='text-white font-semibold text-lg'>Reservar Mesa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    // Action handlers
    const handleSave = () => {
      setIsSaved(!isSaved);
      if (place && onSavePlace) {
        onSavePlace(place);
      }
    };

    const handleShare = async () => {
      if (!place) return;

      try {
        const placeName = place.googleData.name || 'Local interessante';
        const placeAddress = getAddressString(place.googleData.address);

        await Share.share({
          message: `Confira este lugar no Pinubi: ${placeName} - ${placeAddress}`,
          title: placeName,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    };

    const handleReserveTable = () => {
      if (place && onReserveTable) {
        onReserveTable(place);
      } else {
        Alert.alert('Reservar Mesa', 'Funcionalidade de reserva em desenvolvimento.', [{ text: 'Ok' }]);
      }
    };

    const handleReview = () => {
      Alert.alert('Avaliar Local', 'Funcionalidade de avaliação em desenvolvimento.', [{ text: 'Ok' }]);
    };

    // Helper function to safely extract address string
    const getAddressString = (address: any): string => {
      if (!address) {
        return 'Endereço não disponível';
      }
      if (typeof address === 'string') {
        return address;
      }
      if (typeof address === 'object' && address.formatted) {
        return address.formatted;
      }
      return 'Endereço não disponível';
    };

    // Helper function to safely get place type
    const getPlaceType = (): string => {
      const types = place?.googleData.types;      
      if (!types || !Array.isArray(types) || types.length === 0) {
        return 'Estabelecimento';
      }
      return types[0] || 'Estabelecimento';
    };

    const getLocationText = () => {
      const address = place?.googleData.address;
      const addressString = getAddressString(address);

      if (addressString === 'Endereço não disponível') {
        return 'Localização não disponível';
      }

      const parts = addressString.split(',');
      return parts.length > 1 ? parts[parts.length - 1].trim() : addressString;
    };

    // This component doesn't render anything itself - it uses the portal
    return null;
  }
);

PlaceDetailsBottomSheetPortal.displayName = 'PlaceDetailsBottomSheetPortal';

export default PlaceDetailsBottomSheetPortal;
