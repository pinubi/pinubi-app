import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Modal, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { googlePlacesService } from '@/services/googlePlacesService';
import { Place } from '@/types/places';

export type BottomSheetRef = {
  present: () => void;
  dismiss: () => void;
  snapToIndex: (index: number) => void;
  close: () => void;
  collapse: () => void;
  expand: () => void;
  snapToPosition: () => void;
  forceClose: () => void;
};

interface PlaceDetailsBottomSheetPortalProps {
  place: Place | null;
  onClose?: () => void;
  onSavePlace?: (place: Place) => void;
  onReserveTable?: (place: Place) => void;
  onShowOnMap?: (place: Place) => void;
}

const { width, height } = Dimensions.get('window');

// Separate component for photo scrolling to isolate state
const PhotoScrollComponent = ({ photos }: { photos: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasPhotos = photos.length > 0;

  return (
    <View className='relative'>
      {hasPhotos ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate='fast'
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);

            if (index >= 0 && index < photos.length && index !== currentIndex) {
              setCurrentIndex(index);
            }
          }}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);

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
                  googlePlacesService.getPhotoUri(photo) || 'https://via.placeholder.com/64x64/8B4513/FFFFFF?text=🍽️',
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
            {String(currentIndex + 1)}/{String(photos.length)}
          </Text>
        </View>
      )}
    </View>
  );
};

const PlaceDetailsBottomSheetPortal = forwardRef<BottomSheetRef, PlaceDetailsBottomSheetPortalProps>(
  ({ place, onClose, onSavePlace, onReserveTable, onShowOnMap }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const photoScrollViewRef = useRef<ScrollView>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [showAllHours, setShowAllHours] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const insets = useSafeAreaInsets();

    const snapPoints = useMemo(() => [height], [height]); // Use exact screen height in pixels

    // Automatically show bottom sheet when place is set
    useEffect(() => {
      if (place) {
        // Reset photo index when place changes
        setCurrentPhotoIndex(0);
        showBottomSheet();
      } else {
        hideBottomSheet();
      }
    }, [place]);

    // Expose methods to parent component
    React.useImperativeHandle(ref, () => ({
      present: () => {
        showBottomSheet();
      },
      dismiss: () => {
        hideBottomSheet();
      },
      snapToIndex: (index: number) => {
        if (index >= 0) {
          showBottomSheet();
        } else {
          hideBottomSheet();
        }
      },
      close: () => {
        hideBottomSheet();
      },
      collapse: () => hideBottomSheet(),
      expand: () => showBottomSheet(),
      snapToPosition: () => showBottomSheet(),
      forceClose: () => hideBottomSheet(),
    }));

    const showBottomSheet = () => {
      if (!place || !place.googleData) {
        return;
      }
      
      setIsVisible(true);
    };

    const hideBottomSheet = () => {
      setIsVisible(false);
      onClose?.();
    };

    const renderHeaderImage = () => {
      const photos = place?.googleData.photos || [];

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

        <View className='flex-row items-center mb-3'>
          <Text className='text-gray-600 text-base'>{getPriceRangeDisplay()}</Text>
          {getPriceRangeDisplay() && getMainTypeDisplay() && <Text className='text-gray-600 mx-2'>•</Text>}
          <Text className='text-gray-600 text-base'>{getMainTypeDisplay()}</Text>
        </View>

        {place?.googleData.rating && (
          <View className='flex-row items-center'>
            <View className='flex-row items-center bg-primary-50 px-3 py-1 rounded-full'>
              <Ionicons name='star' size={16} color='#9333EA' />
              <Text className='text-primary-600 font-semibold ml-1'>{place.googleData.rating.toFixed(1)}</Text>
              {place.googleData.userRatingsTotal && (
                <Text className='text-primary-600 ml-1'>({place.googleData.userRatingsTotal})</Text>
              )}
            </View>
            {place?.googleData.openingHours?.openNow !== undefined && (
              <View
                className={`ml-3 px-3 py-1 rounded-full ${
                  place.googleData.openingHours.openNow ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    place.googleData.openingHours.openNow ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {place.googleData.openingHours.openNow ? 'Aberto' : 'Fechado'}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );

    const renderPlaceTypes = () => {
      const types = place?.googleData.types;
      if (!types || types.length === 0) return null;

      const displayTypes = types
        .filter((type) => !['establishment', 'point_of_interest'].includes(type))
        .slice(0, 3)
        .map((type) => getTypeDisplayName(type));

      if (displayTypes.length === 0) return null;

      return (
        <View className='px-4 pb-4'>
          <View className='flex-row flex-wrap gap-2'>
            {displayTypes.map((type, index) => (
              <View key={index} className='bg-gray-100 px-3 py-1 rounded-full'>
                <Text className='text-gray-700 text-sm'>{type}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    };

    const renderContactInfo = () => {
      const hasPhone = place?.googleData.phone;
      const hasWebsite = place?.googleData.website;
      const hasOpeningHours = place?.googleData.openingHours?.weekdayText;

      if (!hasPhone && !hasWebsite && !hasOpeningHours) return null;

      const openingHoursToShow = showAllHours
        ? place?.googleData.openingHours?.weekdayText || []
        : place?.googleData.openingHours?.weekdayText?.slice(0, 3) || [];

      return (
        <View className='px-4 pb-6'>
          <Text className='text-xl font-bold text-gray-900 mb-4'>Contato e Horários</Text>

          <View className='flex-col gap-3 space-y-4'>
            {hasPhone && (
              <View className='flex-row items-center'>
                <View className='w-10 h-10 bg-primary-50 rounded-full items-center justify-center mr-3'>
                  <Ionicons name='call-outline' size={20} color='#9333EA' />
                </View>
                <View className='flex-1'>
                  <Text className='text-gray-900 font-medium'>Telefone</Text>
                  <Text className='text-gray-600'>{place.googleData.phone}</Text>
                </View>
              </View>
            )}

            {hasWebsite && (
              <View className='flex-row items-center'>
                <View className='w-10 h-10 bg-primary-50 rounded-full items-center justify-center mr-3'>
                  <Ionicons name='globe-outline' size={20} color='#9333EA' />
                </View>
                <View className='flex-1'>
                  <Text className='text-gray-900 font-medium'>Website</Text>
                  <Text className='text-gray-600 text-sm' numberOfLines={1}>
                    {place.googleData.website}
                  </Text>
                </View>
              </View>
            )}

            {hasOpeningHours && (
              <View className='flex-row items-start'>
                <View className='w-10 h-10 bg-primary-50 rounded-full items-center justify-center mr-3'>
                  <Ionicons name='time-outline' size={20} color='#9333EA' />
                </View>
                <View className='flex-1'>
                  <Text className='text-gray-900 font-medium mb-2'>Horário de Funcionamento</Text>
                  {openingHoursToShow.map((hours, index) => (
                    <Text key={index} className='text-gray-600 text-sm mb-1'>
                      {hours}
                    </Text>
                  ))}
                  {(place.googleData.openingHours?.weekdayText?.length || 0) > 3 && (
                    <TouchableOpacity onPress={handleRenderHours}>
                      <Text className='text-primary-600 text-sm font-medium'>
                        {showAllHours ? 'Ver menos horários' : 'Ver todos os horários'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      );
    };

    const renderLocationInfo = () => (
      <View className='px-4 pb-6'>
        <Text className='text-xl font-bold text-gray-900 mb-4'>Localização</Text>

        <View className='flex-row items-start'>
          <View className='w-10 h-10 bg-primary-50 rounded-full items-center justify-center mr-3'>
            <Ionicons name='location-outline' size={20} color='#9333EA' />
          </View>
          <View className='flex-1'>
            <Text className='text-gray-900 font-medium mb-1'>Endereço</Text>
            <Text className='text-gray-600 leading-relaxed'>{getAddressString(place?.googleData.address)}</Text>
            {place?.googleData.coordinates && (
              <TouchableOpacity
                className='mt-3 bg-primary-500 px-4 py-2 rounded-full self-start'
                onPress={() => place && onShowOnMap?.(place)}
              >
                <Text className='text-white font-medium text-sm'>Ver no mapa</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );

    const renderRatingInfo = () => {
      const rating = place?.googleData.rating;
      const totalRatings = place?.googleData.userRatingsTotal;

      if (!rating && !totalRatings) return null;

      return (
        <View className='px-4 pb-8'>
          <Text className='text-xl font-bold text-gray-900 mb-4'>Avaliações</Text>

          {rating && (
            <View className='bg-gray-50 rounded-xl p-4'>
              <View className='flex-row items-center justify-center mb-2'>
                <Text className='text-4xl font-bold text-gray-900 mr-2'>{rating.toFixed(1)}</Text>
                <View>
                  <View className='flex-row'>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons key={i} name='star' size={20} color={i < Math.floor(rating) ? '#FBBF24' : '#E5E7EB'} />
                    ))}
                  </View>
                  {totalRatings && <Text className='text-gray-600 text-sm mt-1'>{totalRatings} avaliações</Text>}
                </View>
              </View>

              <Text className='text-center text-gray-600'>Avaliação baseada no Google Places</Text>
            </View>
          )}
        </View>
      );
    };

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
        // Handle share error silently
      }
    };

    const handleReserveTable = () => {
      if (place && onReserveTable) {
        onReserveTable(place);
      } else {
        Alert.alert('Reservar Mesa', 'Funcionalidade de reserva em desenvolvimento.', [{ text: 'Ok' }]);
      }
    };

    const handleRenderHours = () => {
      setShowAllHours(prevState => !prevState);
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

    // Helper function to get price range display
    const getPriceRangeDisplay = (): string => {
      const priceLevel = place?.googleData.priceLevel;
      if (!priceLevel) return '';

      const priceMap: Record<number, string> = {
        1: '$',
        2: '$$',
        3: '$$$',
        4: '$$$$',
      };

      return priceMap[priceLevel] || '';
    };

    // Helper function to get main type display
    const getMainTypeDisplay = (): string => {
      const types = place?.googleData.types;
      if (!types || types.length === 0) return '';

      const typeMap: Record<string, string> = {
        restaurant: 'Restaurante',
        food: 'Alimentação',
        cafe: 'Café',
        bar: 'Bar',
        tourist_attraction: 'Atração Turística',
        museum: 'Museu',
        park: 'Parque',
        shopping_mall: 'Shopping',
        hospital: 'Hospital',
        bank: 'Banco',
        gas_station: 'Posto de Combustível',
      };

      for (const type of types) {
        if (typeMap[type]) {
          return typeMap[type];
        }
      }

      return 'Estabelecimento';
    };

    // Helper function to get type display name
    const getTypeDisplayName = (type: string): string => {
      const typeMap: Record<string, string> = {
        restaurant: 'Restaurante',
        food: 'Alimentação',
        cafe: 'Café',
        bar: 'Bar',
        bakery: 'Padaria',
        fast_food: 'Fast Food',
        meal_takeaway: 'Para Viagem',
        tourist_attraction: 'Atração Turística',
        museum: 'Museu',
        park: 'Parque',
        shopping_mall: 'Shopping',
        store: 'Loja',
        hospital: 'Hospital',
        bank: 'Banco',
        gas_station: 'Posto',
        pharmacy: 'Farmácia',
        lodging: 'Hospedagem',
        gym: 'Academia',
        beauty_salon: 'Salão de Beleza',
        car_repair: 'Oficina',
        dentist: 'Dentista',
        doctor: 'Médico',
        veterinary_care: 'Veterinário',
      };

      return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    // This component now renders a full-screen Modal
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
              {/* Header Image */}
              {renderHeaderImage()}

              <ScrollView
                style={{ flex: 1, backgroundColor: 'white' }}
                contentContainerStyle={{ paddingTop: 0 }}
              >
                {/* Place Info */}
                {renderPlaceInfo()}

                {/* Place Types and Category */}
                {renderPlaceTypes()}

                {/* Contact and Opening Hours */}
                {renderContactInfo()}

                {/* Address and Location */}
                {renderLocationInfo()}

                {/* Rating and Reviews */}
                {/* {renderRatingInfo()} */}

                {/* Fixed Bottom Actions */}
                {/* {renderBottomActions()} */}
              </ScrollView>
            </>
          )}
        </View>
      </Modal>
    );
  }
);

PlaceDetailsBottomSheetPortal.displayName = 'PlaceDetailsBottomSheetPortal';

export default PlaceDetailsBottomSheetPortal;
