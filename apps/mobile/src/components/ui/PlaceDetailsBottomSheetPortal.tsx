import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Modal, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';

import type { CheckInBottomSheetRef } from '@/components/checkin';
import { CheckInBottomSheetPortal } from '@/components/checkin';
import GoogleLogo from '@/components/GoogleLogo';
import AddToListBottomSheetPortal, { AddToListBottomSheetRef } from '@/components/lists/AddToListBottomSheetPortal';
import PinubiLogo from '@/components/PinubiLogo';
import PlaceStatistics from '@/components/ui/PlaceStatistics';
import { googlePlacesService } from '@/services/googlePlacesService';
import { reviewService } from '@/services/reviewService';
import { sharingService } from '@/services/sharingService';
import { List } from '@/types/lists';

import { Place, Reviews, UserPlaceList } from '@pinubi/types';

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
  userLists: UserPlaceList[] | null;
  reviews: Reviews[] | null;
  onClose?: () => void;
  onSavePlace?: (place: Place) => void;
  onReserveTable?: (place: Place) => void;
  onShowOnMap?: (place: Place) => void;
}

const { width, height } = Dimensions.get('window');

// Floating Action Buttons Component
const FloatingActionButtons = ({ onCheckIn, onAddToList }: { onCheckIn: () => void; onAddToList: () => void }) => {
  return (
    <View className='absolute bottom-8 left-4 right-4 flex-row gap-3 z-10'>
      {/* Check-in Floating Button */}
      <TouchableOpacity
        onPress={onCheckIn}
        className='flex-1 bg-primary-500 rounded-full px-6 py-4 flex-row items-center justify-center shadow-lg'
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        activeOpacity={0.8}
      >
        <Ionicons name='location' size={20} color='white' />
        <Text className='text-white font-semibold ml-2'>Check-in</Text>
      </TouchableOpacity>

      {/* Add to List Floating Button */}
      <TouchableOpacity
        onPress={onAddToList}
        className='flex-1 bg-white rounded-full px-6 py-4 flex-row items-center justify-center border border-gray-200 shadow-lg'
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        activeOpacity={0.8}
      >
        <Ionicons name='bookmark-outline' size={20} color='#374151' />
        <Text className='text-gray-700 font-semibold ml-2'>Adicionar</Text>
      </TouchableOpacity>
    </View>
  );
};

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
  ({ place, userLists, reviews, onClose, onSavePlace, onReserveTable, onShowOnMap }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const checkInRef = useRef<CheckInBottomSheetRef>(null);
    const addToListRef = useRef<AddToListBottomSheetRef>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [showAllHours, setShowAllHours] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [pinubiRating, setPinubiRating] = useState<number | null>(null);
    const [pinubiReviewsCount, setPinubiReviewsCount] = useState<number>(0);

    // Automatically show bottom sheet when place is set
    useEffect(() => {
      if (place) {
        // Reset photo index when place changes
        setCurrentPhotoIndex(0);
        showBottomSheet();
        // Fetch Pinubi community rating
        fetchPinubiRating();
      } else {
        hideBottomSheet();
        // Reset Pinubi rating when no place
        setPinubiRating(null);
        setPinubiReviewsCount(0);
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

    const fetchPinubiRating = async () => {
      if (!place?.id) {
        setPinubiRating(null);
        setPinubiReviewsCount(0);
        return;
      }

      try {
        const response = await reviewService.getPlaceReviews({
          placeId: place.id,
          limit: 1, // We only need the statistics, not the actual reviews
        });

        if (response.success) {
          const responseData = (response as any).data || response;
          const statistics = responseData.statistics || {};

          if (statistics.totalReviews > 0) {
            setPinubiRating(statistics.overallAverage);
            setPinubiReviewsCount(statistics.totalReviews);
          } else {
            setPinubiRating(null);
            setPinubiReviewsCount(0);
          }
        }
      } catch (error) {
        console.error('Error fetching Pinubi rating:', error);
        setPinubiRating(null);
        setPinubiReviewsCount(0);
      }
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
          <View className='flex-col space-y-2'>
            {/* Ratings Row */}
            <View className='flex-row items-center flex-wrap gap-2'>
              {/* Google Rating */}
              <View className='flex-row items-center bg-primary-50 px-3 py-1 rounded-full'>
                <Ionicons name='star' size={16} color='#9333EA' />
                <Text className='text-primary-600 font-semibold ml-1'>{place.googleData.rating.toFixed(1)}</Text>
                {place.googleData.userRatingsTotal && (
                  <Text className='text-primary-600 ml-1'>({place.googleData.userRatingsTotal})</Text>
                )}
                <View className='ml-2'>
                  <GoogleLogo size={16} />
                </View>
              </View>

              {/* Pinubi Community Rating */}
              {pinubiRating && pinubiReviewsCount > 0 && (
                <View className='flex-row items-center bg-primary-50 px-3 py-1 rounded-full'>
                  <Ionicons name='star' size={16} color='#9333EA' />
                  <Text className='text-primary-600 font-semibold ml-1'>{pinubiRating.toFixed(1)}</Text>
                  <Text className='text-primary-600 ml-1'>({pinubiReviewsCount})</Text>
                  <Text className='text-primary-600 ml-1 text-xs font-medium'>Pinubi</Text>
                  <View className='ml-2'>
                    <PinubiLogo size={10} />
                  </View>
                </View>
              )}

              {/* Open/Closed Status */}
              {place?.googleData.openingHours?.openNow !== undefined && (
                <View
                  className={`px-3 py-1 rounded-full ${
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

    const renderFloatingButtons = () => <FloatingActionButtons onCheckIn={handleCheckIn} onAddToList={handleSave} />;

    const renderPlaceStatistics = () => {
      return <PlaceStatistics placeId={place?.id || ''} onShowAllReviews={handleShowAllReviews} />;
    };

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
      if (place) {
        addToListRef.current?.present();
      }
    };

    const handleShare = async () => {
      if (!place) return;

      try {
        const success = await sharingService.sharePlace({
          id: place.id,
          name: place.googleData.name || 'Local interessante',
          address: getAddressString(place.googleData.address),
          rating: pinubiRating || place.googleData.rating,
        });

        if (!success) {
          // Fallback to basic sharing if the service fails
          await Share.share({
            message: `Confira este lugar no Pinubi: ${place.googleData.name || 'Local interessante'} - ${getAddressString(place.googleData.address)}`,
            title: place.googleData.name || 'Local interessante',
          });
        }
      } catch (error) {
        // Handle share error silently
        console.error('Error sharing place:', error);
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
      setShowAllHours((prevState) => !prevState);
    };

    // Check-in handlers
    const handleCheckIn = () => {
      if (place) {
        checkInRef.current?.present();
      }
    };

    const handleCheckInComplete = (completedPlace: Place) => {
      console.log('Check-in completed for:', completedPlace.googleData.name);
      // Could trigger a refresh of check-in history here if needed
    };

    const handlePlaceAdded = (addedPlace: Place, list: List) => {
      console.log('Place added to list:', addedPlace.googleData.name, 'List:', list.title);
      // Update the isSaved state to reflect that the place has been saved
      setIsSaved(true);
      // Could trigger other actions like refreshing lists or showing additional feedback
    };

    const handleShowAllReviews = () => {
      // TODO: Navigate to full reviews screen
      Alert.alert('Todas as Avaliações', 'Tela de avaliações completa em desenvolvimento.', [{ text: 'OK' }]);
    };

    const handleShowAllCheckIns = () => {
      // TODO: Navigate to full check-in history screen
      Alert.alert('Histórico de Check-ins', 'Tela de histórico completo em desenvolvimento.', [{ text: 'OK' }]);
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
      <Modal visible={isVisible} animationType='slide' presentationStyle='fullScreen' onRequestClose={hideBottomSheet}>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', height, width }}>
          {place && (
            <>
              {/* Header Image */}
              {renderHeaderImage()}

              <ScrollView
                style={{ flex: 1, backgroundColor: 'white' }}
                contentContainerStyle={{ paddingTop: 0, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Place Info */}
                {renderPlaceInfo()}

                {/* Place Types and Category */}
                {renderPlaceTypes()}

                {/* Contact and Opening Hours */}
                {renderContactInfo()}

                {/* Address and Location */}
                {renderLocationInfo()}

                {/* Place Statistics and Reviews */}
                {renderPlaceStatistics()}

                {/* Rating and Reviews */}
                {/* {renderRatingInfo()} */}

                {/* Fixed Bottom Actions */}
                {/* {renderBottomActions()} */}
              </ScrollView>

              {/* Floating Action Buttons */}
              {renderFloatingButtons()}
            </>
          )}

          {/* Check-in Modal */}
          <CheckInBottomSheetPortal ref={checkInRef} place={place} onCheckInComplete={handleCheckInComplete} />
          <AddToListBottomSheetPortal ref={addToListRef} place={place} onPlaceAdded={handlePlaceAdded} />
        </View>
      </Modal>
    );
  }
);

PlaceDetailsBottomSheetPortal.displayName = 'PlaceDetailsBottomSheetPortal';

export default PlaceDetailsBottomSheetPortal;
