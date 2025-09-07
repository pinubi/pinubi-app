import Header from '@/components/Header';
import { AddPlaceBottomSheetPortal, type BottomSheetRef } from '@/components/ui';
import CreateEditListBottomSheetPortal from '@/components/ui/CreateEditListBottomSheetPortal';
import PlaceDetailsBottomSheetPortal from '@/components/ui/PlaceDetailsBottomSheetPortal';
import { useListPlaces } from '@/hooks/useListPlaces';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

import { useLists } from '@/hooks/useLists';
import { googlePlacesService } from '@/services/googlePlacesService';
import type { AddPlaceToListRequest, ListFormData, ListPlaceWithDetails } from '@/types/lists';
import type { Place } from '@/types/places';

interface PlaceCardProps {
  place: ListPlaceWithDetails;
  onPress?: () => void;
  onDelete?: () => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onPress, onDelete }) => {
  // Early return if no place prop
  if (!place) {
    return null;
  }

  const placeData = place?.place;

  // Early return if no place data
  if (!placeData) {
    return null;
  }

  // Safe string helpers with fallbacks
  const getPlaceImage = (): string => {
    try {
      if (placeData.photos && Array.isArray(placeData.photos) && placeData.photos.length > 0) {
        return (
          String(googlePlacesService.getPhotoUri(placeData.photos[0])) ||
          'https://via.placeholder.com/64x64/8B4513/FFFFFF?text=🍽️'
        );
      }
    } catch (e) {
      console.warn('Error getting place image:', e);
    }
    return 'https://via.placeholder.com/64x64/8B4513/FFFFFF?text=🍽️';
  };

  const getPriceRange = (): string => {
    try {
      if (placeData.priceLevel && typeof placeData.priceLevel === 'number' && placeData.priceLevel > 0) {
        const level = Math.max(1, Math.min(4, placeData.priceLevel));
        return '$'.repeat(level);
      }
    } catch (e) {
      console.warn('Error getting price range:', e);
    }
    return '$';
  };

  const getCategory = (): string => {
    try {
      if (placeData.types && Array.isArray(placeData.types) && placeData.types.length > 0) {
        const primaryType = String(placeData.types[0]);
        const typeMap: Record<string, string> = {
          restaurant: 'Restaurante',
          food: 'Comida',
          establishment: 'Estabelecimento',
          meal_takeaway: 'Delivery',
          cafe: 'Café',
          bar: 'Bar',
          bakery: 'Padaria',
        };
        return typeMap[primaryType] || primaryType || 'Lugar';
      }
    } catch (e) {
      console.warn('Error getting category:', e);
    }
    return 'Lugar';
  };

  const getAddressText = (): string => {
    try {
      // Check personal note first
      if (place.personalNote && typeof place.personalNote === 'string' && place.personalNote.trim()) {
        return String(place.personalNote.trim());
      }

      // Check formatted address
      if (placeData.address) {
        if (typeof placeData.address === 'object' && (placeData.address as any)?.formatted) {
          return String((placeData.address as any).formatted);
        }

        if (typeof placeData.address === 'string' && placeData.address.trim()) {
          return String(placeData.address.trim());
        }
      }
    } catch (e) {
      console.warn('Error getting address text:', e);
    }

    return 'Endereço não disponível';
  };

  const formatRating = (): string | null => {
    try {
      if (placeData.rating && typeof placeData.rating === 'number' && placeData.rating > 0) {
        return String(placeData.rating.toFixed(1));
      }
    } catch (e) {
      console.warn('Error formatting rating:', e);
    }
    return null;
  };

  // Pre-compute all text values as strings with safe fallbacks
  const placeName: string = String(placeData?.name || 'Lugar sem nome');
  const addressText: string = getAddressText();
  const categoryText: string = getCategory();
  const priceText: string = getPriceRange();
  const ratingText: string | null = formatRating();
  const placeImageUri: string = getPlaceImage();

  return (
    <TouchableOpacity
      onPress={() => {
        try {
          if (onPress && typeof onPress === 'function') {
            onPress();
          }
        } catch (e) {
          console.warn('Error in onPress handler:', e);
        }
      }}
      className='bg-white rounded-2xl mb-4 shadow-sm border border-gray-100'
      style={{ elevation: 2 }}
    >
      <View className='flex-row p-4'>
        {/* Place Image */}
        <View className='w-16 h-16 rounded-xl bg-gray-200 mr-4 overflow-hidden'>
          <Image source={{ uri: placeImageUri }} className='w-full h-full' style={{ resizeMode: 'cover' }} />
        </View>

        {/* Place Info */}
        <View className='flex-1'>
          {/* Name */}
          <View className='flex-row items-center justify-between mb-1'>
            <Text className='text-lg font-semibold text-gray-900' numberOfLines={1}>
              {placeName}
            </Text>
          </View>

          {/* Price and Category */}
          <View className='flex-row items-center mb-2'>
            <Text className='text-sm font-medium text-gray-600'>{priceText}</Text>
            <Text className='text-sm text-gray-500 mx-2'>•</Text>
            <Text className='text-sm text-gray-600'>{categoryText}</Text>
          </View>

          {/* Personal Note or Address */}
          <Text className='text-sm text-gray-600 mb-3' numberOfLines={2}>
            {addressText}
          </Text>

          {/* Rating and Tags */}
          <View className='flex-row items-center justify-between'>
            <View className='flex-row items-center'>
              {ratingText && (
                <>
                  <Ionicons name='star' size={16} color='#FCD34D' />
                  <Text className='text-sm font-medium text-gray-700 ml-1'>{ratingText}</Text>
                </>
              )}

              {place?.tags && Array.isArray(place.tags) && place.tags.length > 0 && (
                <View className='flex-row items-center ml-4'>
                  <Ionicons name='pricetag-outline' size={16} color='#9CA3AF' />
                  <Text className='text-sm text-gray-500 ml-1'>{String(place.tags.slice(0, 2).join(', '))}</Text>
                </View>
              )}
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => {
                try {
                  if (onDelete && typeof onDelete === 'function') {
                    onDelete();
                  }
                } catch (e) {
                  console.warn('Error in onDelete handler:', e);
                }
              }}
              className='w-8 h-8 items-center justify-center'
            >
              <Ionicons name='trash-outline' size={18} color='#EF4444' />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ListPlacesScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const addPlaceBottomSheetRef = useRef<BottomSheetRef>(null);
  const placeDetailsBottomSheetRef = useRef<BottomSheetRef>(null);
  const editListBottomSheetRef = useRef<BottomSheetRef>(null);

  // State for selected place in details view
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // State for dropdown menu
  const [showMoreOptionsDropdown, setShowMoreOptionsDropdown] = useState(false);

  // State for current list data (can be updated)
  const [currentListData, setCurrentListData] = useState<{
    title: string;
    emoji: string;
    description: string;
    visibility: 'public' | 'private';
    tags: string[];
  }>({
    title: (params.title as string) || 'Lista',
    emoji: (params.emoji as string) || '🍽️',
    description: (params.description as string) || '',
    visibility: (params.isPublic === 'true' ? 'public' : 'private'),
    tags: [],
  });

  // Get list data from params
  const listId = params.listId as string;
  const canDelete = params.canDelete === 'true';
  const canRename = params.canRename === 'true';
  const isPublic = params.isPublic === 'true';

  // Use the list places hook
  const { places, placesCount, loading, error, addPlace, removePlace, refresh, clearError, hasPlaces, isEmpty } =
    useListPlaces(listId);

  const { refresh: refreshLists, updateList, deleteList, getListById } = useLists();

  // State for sorting
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'distance'>('recent');

  // State for view mode (list or map)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    if (!listId) return;

    try {
      const urlPublic = 'https://www.pinubi.com/';

      await Share.share({
        message: `Confira a minha lista no Pinubi: ${urlPublic}`,
        title: currentListData.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleMoreOptions = () => {
    setShowMoreOptionsDropdown(!showMoreOptionsDropdown);
  };

  const handleEditList = () => {
    setShowMoreOptionsDropdown(false);
    editListBottomSheetRef.current?.snapToIndex(0);
  };

  const handleSaveEditList = async (listData: ListFormData) => {
    try {
      const success = await updateList(listId, listData);
      if (success) {
        // Update local state immediately for UI responsiveness
        setCurrentListData({
          title: listData.title,
          emoji: listData.emoji,
          description: listData.description,
          visibility: listData.visibility,
          tags: listData.tags || [],
        });
        
        Alert.alert('Sucesso!', 'Lista atualizada com sucesso!');
        
        // Refresh lists to ensure consistency
        await refreshLists();
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar a lista. Tente novamente.');
      }
    } catch (error) {
      console.error('Error updating list:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a lista. Tente novamente.');
    }
  };

  const handleDeleteList = () => {
    setShowMoreOptionsDropdown(false);
    Alert.alert(
      'Apagar Lista',
      `Tem certeza que deseja apagar a lista "${currentListData.title}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteList(listId);
              if (success) {
                Alert.alert('Sucesso', 'Lista apagada com sucesso!');
                router.back(); // Navigate back to lists screen
              } else {
                Alert.alert('Erro', 'Não foi possível apagar a lista. Tente novamente.');
              }
            } catch (error) {
              console.error('Error deleting list:', error);
              Alert.alert('Erro', 'Não foi possível apagar a lista. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const handleAddPlace = () => {
    addPlaceBottomSheetRef.current?.snapToIndex(0);
  };

  const handlePlacePress = (place: ListPlaceWithDetails) => {
    // Convert ListPlaceWithDetails to Place format for the bottom sheet
    const convertedPlace: Place = {
      id: place.placeId,
      googleData: {
        name: place.place?.name || 'Local sem nome',
        address: place.place?.address || 'Endereço não disponível',
        coordinates: place.place?.coordinates || { lat: 0, lng: 0 },
        phone: place.place?.phone,
        website: place.place?.website,
        rating: place.place?.rating,
        userRatingsTotal: undefined, // This might not be available in ListPlaceWithDetails
        photos: place.place?.photos || [],
        types: place.place?.types || [],
        priceLevel: place.place?.priceLevel,
        openingHours: undefined, // This might not be available in ListPlaceWithDetails
      },
      coordinates: place.place?.coordinates || { lat: 0, lng: 0 },
      searchableText: place.place?.name,
      addedBy: [],
      totalAdds: 0,
      categories: place.place?.types,
      createdAt: place.addedAt,
    };

    setSelectedPlace(convertedPlace);
    placeDetailsBottomSheetRef.current?.snapToIndex(0);
  };

  const handlePlaceDetailsClose = () => {
    setSelectedPlace(null);
  };

  const handleDeletePlace = async (place: ListPlaceWithDetails) => {
    try {
      Alert.alert('Remover lugar', `Deseja remover "${place.place?.name}" desta lista?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const success = await removePlace(place.placeId);
            if (success) {
              Alert.alert('Sucesso', 'Lugar removido da lista!');
            } else if (error) {
              Alert.alert('Erro', error);
            }
          },
        },
      ]);
    } catch (err) {
      console.error('Error removing place:', err);
      Alert.alert('Erro', 'Não foi possível remover o lugar. Tente novamente.');
    }
  };

  const handleSavePlace = async (placeData: AddPlaceToListRequest) => {
    try {
      // Use the addPlace function from useListPlaces hook
      // This handles the complete flow:
      // 1. Check if place exists in Firestore
      // 2. Create place if it doesn't exist
      // 3. Add the place to the current list
      const success = await addPlace(placeData);

      if (success) {
        Alert.alert('Sucesso!', 'Lugar adicionado à lista com sucesso!');

        // Refresh the places list to show the new place
        await refresh();
        await refreshLists();
      } else {
        // Error handling is managed by the store/hook
        if (error) {
          Alert.alert('Erro', error);
        } else {
          Alert.alert('Erro', 'Não foi possível adicionar o lugar. Tente novamente.');
        }
      }
    } catch (err) {
      console.error('❌ Error saving place:', err);
      Alert.alert('Erro', 'Não foi possível adicionar o lugar. Tente novamente.');
    }
  };

  const getSortedPlaces = () => {
    if (!places || places.length === 0) return [];

    switch (sortBy) {
      case 'rating':
        return [...places].sort((a, b) => {
          const ratingA = a.place?.rating || 0;
          const ratingB = b.place?.rating || 0;
          return ratingB - ratingA;
        });
      case 'distance':
        // For now, sort by order since we don't have distance calculation
        return [...places].sort((a, b) => a.order - b.order);
      case 'recent':
      default:
        return [...places].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }
  };

  // Function to get appropriate food emoji based on place category/type
  const getFoodEmoji = (place: ListPlaceWithDetails): string => {
    const name = place.place?.name?.toLowerCase() || '';
    const types = place.place?.types?.join(' ').toLowerCase() || '';
    const searchText = `${name} ${types}`;

    // Pizza places
    if (searchText.includes('pizza')) return '🍕';

    // Coffee/Cafes
    if (searchText.includes('café') || searchText.includes('coffee')) return '☕';

    // Sushi/Japanese
    if (searchText.includes('sushi') || searchText.includes('japonês') || searchText.includes('japanese')) return '🍣';

    // Italian
    if (searchText.includes('italiano') || searchText.includes('italian')) return '🍝';

    // Bakery/Padaria/Dessert
    if (
      searchText.includes('padaria') ||
      searchText.includes('bakery') ||
      searchText.includes('bistrô') ||
      searchText.includes('armazém')
    )
      return '🥐';

    // Fast food/Burger
    if (
      searchText.includes('lanche') ||
      searchText.includes('burger') ||
      searchText.includes('hambúrguer') ||
      searchText.includes('fast food')
    )
      return '🍔';

    // Ice cream
    if (searchText.includes('sorvete') || searchText.includes('ice cream')) return '🍦';

    // Chinese
    if (searchText.includes('chinês') || searchText.includes('chinese')) return '🥡';

    // Barbecue/Churrasco
    if (searchText.includes('churrasco') || searchText.includes('barbecue') || searchText.includes('carne'))
      return '🥩';

    // Mexican
    if (searchText.includes('mexicano') || searchText.includes('mexican')) return '🌮';

    // Lebanese/Middle Eastern
    if (searchText.includes('libanês') || searchText.includes('árabe') || searchText.includes('lebanese')) return '🥙';

    // Bar/Drinks
    if (searchText.includes('bar')) return '🍺';

    // Default food emoji for restaurants
    return '🍽️';
  };

  // Handle map marker press
  const handleMapMarkerPress = (place: ListPlaceWithDetails) => {
    handlePlacePress(place);
  };

  // Calculate center point of all places for map initial region
  const getMapRegion = () => {
    if (!places || places.length === 0) {
      // Default to São Paulo if no places
      return {
        latitude: -23.55052,
        longitude: -46.633309,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    const validPlaces = places.filter(
      (place) =>
        place.place?.coordinates?.lat &&
        place.place?.coordinates?.lng &&
        place.place.coordinates.lat !== 0 &&
        place.place.coordinates.lng !== 0
    );

    if (validPlaces.length === 0) {
      return {
        latitude: -23.55052,
        longitude: -46.633309,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    const lats = validPlaces.map((place) => place.place!.coordinates!.lat);
    const lngs = validPlaces.map((place) => place.place!.coordinates!.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Add some padding to the deltas
    const latDelta = Math.max((maxLat - minLat) * 1.2, 0.01);
    const lngDelta = Math.max((maxLng - minLng) * 1.2, 0.01);

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  const sortedPlaces = getSortedPlaces();

  // Clear error when component unmounts or user dismisses
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000); // Clear error after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Fetch complete list data to get tags and other details
  React.useEffect(() => {
    const fetchListData = async () => {
      try {
        const fullListData = getListById(listId);
        if (fullListData) {
          setCurrentListData({
            title: fullListData.title,
            emoji: fullListData.emoji,
            description: fullListData.description,
            visibility: fullListData.visibility,
            tags: fullListData.tags || [],
          });
        }
      } catch (error) {
        console.warn('Error fetching complete list data:', error);
      }
    };

    if (listId) {
      fetchListData();
    }
  }, [listId, getListById]);

  // Close dropdown when touching outside
  React.useEffect(() => {
    const handleOutsidePress = () => {
      if (showMoreOptionsDropdown) {
        setShowMoreOptionsDropdown(false);
      }
    };

    // This effect will run when showMoreOptionsDropdown changes
    return () => {
      // Cleanup if needed
    };
  }, [showMoreOptionsDropdown]);

  // Dropdown Menu Component
  const MoreOptionsDropdown = () => {
    if (!showMoreOptionsDropdown) return null;

    return (
      <View
        style={{
          position: 'absolute',
          top: 60, // Position below the header
          right: 16,
          backgroundColor: 'white',
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 5,
          zIndex: 1000,
          minWidth: 160,
        }}
      >
        <TouchableOpacity
          onPress={handleEditList}
          className='flex-row items-center px-4 py-3 border-b border-gray-100'
          disabled={!canRename}
          style={{ opacity: !canRename ? 0.5 : 1 }}
        >
          <Ionicons name='pencil-outline' size={18} color='#374151' />
          <Text className='text-gray-800 font-medium ml-3'>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteList}
          className='flex-row items-center px-4 py-3'
          disabled={!canDelete}
          style={{ opacity: !canRename ? 0.5 : 1 }}
        >
          <Ionicons name='trash-outline' size={18} color='#EF4444' />
          <Text className='text-red-500 font-medium ml-3'>Apagar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className='flex-1 bg-gray-50'>
      {/* Dropdown overlay - to handle clicks outside */}
      {showMoreOptionsDropdown && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onPress={() => setShowMoreOptionsDropdown(false)}
          activeOpacity={1}
        />
      )}

      {/* Header */}
      <Header
        className='bg-white border-b border-gray-100'
        title=''
        onLeftPress={handleBack}
        rightIcon='share-outline'
        secondaryRightIcon='ellipsis-horizontal'
        onRightPress={handleShare}
        onSecondaryRightPress={handleMoreOptions}
      />

      {/* More Options Dropdown */}
      <MoreOptionsDropdown />

      {/* Content */}
      {viewMode === 'list' ? (
        <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
          {/* List Header */}
          <View className='bg-white px-4 py-6 border-b border-gray-100'>
            <View className='items-center'>
              <Text className='text-4xl mb-2'>{currentListData.emoji}</Text>
              <Text className='text-2xl font-bold text-gray-900 mb-2'>
                {currentListData.title} ({placesCount})
              </Text>

              {/* List Meta */}
              <View className='flex-row items-center mb-4'>
                <View className='flex-row items-center'>
                  <Ionicons name={isPublic ? 'globe-outline' : 'person-outline'} size={16} color='#6B7280' />
                  <Text className='text-sm text-gray-600 ml-1'>por Você</Text>
                </View>
                <Text className='text-sm text-gray-500 mx-2'>•</Text>
                <Text className='text-sm text-gray-600'>15 de dezembro de 2024</Text>
              </View>

              {/* Description */}
              {currentListData.description && (
                <Text className='text-center text-gray-600 mb-4 leading-relaxed'>{currentListData.description}</Text>
              )}

              {/* Add Place Button */}
              <TouchableOpacity
                onPress={handleAddPlace}
                className='w-full bg-primary-500 rounded-xl px-6 py-4 flex-row items-center justify-center'
              >
                <Ionicons name='add' size={20} color='white' />
                <Text className='text-white font-semibold ml-2'>Adicionar lugar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* View Controls and Sort Options */}
          <View className='bg-white px-4 py-3 border-b border-gray-100'>
            <View className='flex-row items-center justify-between'>
              {/* View Mode Toggle */}
              <View className='flex-row bg-gray-100 rounded-lg p-1'>
                <TouchableOpacity
                  onPress={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md flex-row items-center ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : ''
                  }`}
                >
                  <Ionicons name='list-outline' size={18} color={viewMode === 'list' ? '#b13bff' : '#6B7280'} />
                  <Text
                    className={`ml-2 text-sm font-medium ${viewMode === 'list' ? 'text-primary-600' : 'text-gray-600'}`}
                  >
                    Lista
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-md flex-row items-center ${
                    (viewMode as 'list' | 'map') === 'map' ? 'bg-white shadow-sm' : ''
                  }`}
                >
                  <Ionicons
                    name='map-outline'
                    size={18}
                    color={(viewMode as 'list' | 'map') === 'map' ? '#b13bff' : '#6B7280'}
                  />
                  <Text
                    className={`ml-2 text-sm font-medium ${
                      (viewMode as 'list' | 'map') === 'map' ? 'text-primary-600' : 'text-gray-600'
                    }`}
                  >
                    Mapa
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sort Options - only show in list view */}
              {/* {viewMode === 'list' && (
                <TouchableOpacity
                  onPress={() => {
                    const options = ['recent', 'rating', 'distance'];
                    const currentIndex = options.indexOf(sortBy);
                    const nextIndex = (currentIndex + 1) % options.length;
                    setSortBy(options[nextIndex] as any);
                  }}
                  className='flex-row items-center bg-gray-100 rounded-full px-3 py-2'
                >
                  <Text className='text-sm text-gray-700 font-medium'>
                    {sortBy === 'recent' && 'Recente'}
                    {sortBy === 'rating' && 'Avaliação'}
                    {sortBy === 'distance' && 'Distância'}
                  </Text>
                  <Ionicons name='chevron-down' size={16} color='#6B7280' style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )} */}
            </View>
          </View>

          {/* List View Content */}
          <View className='px-4 py-4'>
            {/* Loading State */}
            {loading && (
              <View className='items-center py-12'>
                <ActivityIndicator size='large' color='#b13bff' />
                <Text className='text-gray-600 mt-4'>Carregando lugares...</Text>
              </View>
            )}

            {/* Error State */}
            {error && !loading && (
              <View className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
                <Text className='text-red-800 font-medium'>{error}</Text>
                <TouchableOpacity onPress={clearError} className='mt-2'>
                  <Text className='text-red-600 text-sm'>Dispensar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Places Content */}
            {!loading && (
              <>
                {hasPlaces
                  ? sortedPlaces.map((place) => (
                      <PlaceCard
                        key={place.id}
                        place={place}
                        onPress={() => handlePlacePress(place)}
                        onDelete={() => handleDeletePlace(place)}
                      />
                    ))
                  : !error && (
                      <View className='items-center py-12'>
                        <Text className='text-4xl mb-4'>🍽️</Text>
                        <Text className='text-lg font-medium text-gray-900 mb-2'>Nenhum lugar adicionado</Text>
                        <Text className='text-gray-600 text-center mb-6'>
                          Comece adicionando lugares que você quer visitar ou já visitou.
                        </Text>
                        <TouchableOpacity onPress={handleAddPlace} className='bg-primary-500 rounded-full px-6 py-3'>
                          <Text className='text-white font-semibold'>Adicionar primeiro lugar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
              </>
            )}
          </View>

          {/* Bottom spacing */}
          <View className='h-6' />
        </ScrollView>
      ) : (
        /* Map View */
        <View className='flex-1'>
          {/* Compact Header for Map */}
          <View className='bg-white px-4 py-4 border-b border-gray-100'>
            <View className='flex-row items-center justify-between'>
              {/* Left side - List info */}
              <View className='flex-row items-center flex-1'>
                <Text className='text-2xl mr-3'>{currentListData.emoji}</Text>
                <View>
                  <Text className='text-lg font-bold text-gray-900'>
                    {currentListData.title} ({placesCount})
                  </Text>
                  <Text className='text-sm text-gray-600'>
                    {placesCount === 0 ? 'Nenhum lugar' : `${placesCount} ${placesCount === 1 ? 'lugar' : 'lugares'}`}
                  </Text>
                </View>
              </View>

              {/* Right side - Add place button */}
              <TouchableOpacity
                onPress={handleAddPlace}
                className='bg-primary-500 rounded-full px-4 py-2 flex-row items-center'
              >
                <Ionicons name='add' size={18} color='white' />
                <Text className='text-white font-semibold ml-1'>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {/* View Mode Toggle */}
            <View className='flex-row bg-gray-100 rounded-lg p-1 mt-3'>
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                className={`flex-1 px-4 py-2 rounded-md flex-row items-center justify-center ${
                  (viewMode as 'list' | 'map') === 'list' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Ionicons
                  name='list-outline'
                  size={18}
                  color={(viewMode as 'list' | 'map') === 'list' ? '#b13bff' : '#6B7280'}
                />
                <Text
                  className={`ml-2 text-sm font-medium ${
                    (viewMode as 'list' | 'map') === 'list' ? 'text-primary-600' : 'text-gray-600'
                  }`}
                >
                  Lista
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setViewMode('map')}
                className={`flex-1 px-4 py-2 rounded-md flex-row items-center justify-center ${
                  (viewMode as 'list' | 'map') === 'map' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Ionicons
                  name='map-outline'
                  size={18}
                  color={(viewMode as 'list' | 'map') === 'map' ? '#b13bff' : '#6B7280'}
                />
                <Text
                  className={`ml-2 text-sm font-medium ${
                    (viewMode as 'list' | 'map') === 'map' ? 'text-primary-600' : 'text-gray-600'
                  }`}
                >
                  Mapa
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Map Content */}
          {loading && (
            <View className='flex-1 items-center justify-center'>
              <ActivityIndicator size='large' color='#b13bff' />
              <Text className='text-gray-600 mt-4'>Carregando lugares...</Text>
            </View>
          )}

          {error && !loading && (
            <View className='flex-1 items-center justify-center px-4'>
              <View className='bg-red-50 border border-red-200 rounded-lg p-4 w-full max-w-sm'>
                <Text className='text-red-800 font-medium text-center'>{error}</Text>
                <TouchableOpacity onPress={clearError} className='mt-2'>
                  <Text className='text-red-600 text-sm text-center'>Dispensar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!loading && !error && (
            <>
              {hasPlaces ? (
                <MapView
                  style={{ flex: 1 }}
                  provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                  initialRegion={getMapRegion()}
                  userInterfaceStyle='light'
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                  showsCompass={false}
                  showsScale={false}
                  mapType='standard'
                  showsBuildings={false}
                  showsIndoors={false}
                  showsPointsOfInterest={false}
                  showsTraffic={false}
                  rotateEnabled={true}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  pitchEnabled={false}
                  loadingEnabled={true}
                  loadingIndicatorColor='#b13bff'
                  loadingBackgroundColor='#fafafa'
                >
                  {/* Places markers */}
                  {sortedPlaces.map((place) => {
                    // Only render markers with valid coordinates
                    const lat = place.place?.coordinates?.lat;
                    const lng = place.place?.coordinates?.lng;

                    if (!lat || !lng || lat === 0 || lng === 0) {
                      return null;
                    }

                    return (
                      <Marker
                        key={place.id}
                        coordinate={{
                          latitude: lat,
                          longitude: lng,
                        }}
                        onPress={() => handleMapMarkerPress(place)}
                        title={place.place?.name || 'Local sem nome'}
                        description={place.place?.address || place.personalNote || 'Endereço não disponível'}
                      >
                        <View className='relative'>
                          {/* Food place marker with emoji */}
                          <View className='w-12 h-12 bg-primary-500 rounded-full items-center justify-center shadow-lg border-2 border-white'>
                            <Text style={{ fontSize: 20 }}>{getFoodEmoji(place)}</Text>
                          </View>
                        </View>
                      </Marker>
                    );
                  })}
                </MapView>
              ) : (
                <View className='flex-1 items-center justify-center px-4'>
                  <Text className='text-4xl mb-4'>🗺️</Text>
                  <Text className='text-lg font-medium text-gray-900 mb-2'>Nenhum lugar para mostrar no mapa</Text>
                  <Text className='text-gray-600 text-center mb-6'>
                    Adicione lugares à sua lista para vê-los no mapa.
                  </Text>
                  <TouchableOpacity onPress={handleAddPlace} className='bg-primary-500 rounded-full px-6 py-3'>
                    <Text className='text-white font-semibold'>Adicionar primeiro lugar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Add Place Bottom Sheet */}
      <AddPlaceBottomSheetPortal
        ref={addPlaceBottomSheetRef}
        listId={listId}
        onSave={handleSavePlace}
        onClose={() => addPlaceBottomSheetRef.current?.close()}
      />

      {/* Edit List Bottom Sheet */}
      <CreateEditListBottomSheetPortal
        ref={editListBottomSheetRef}
        mode="edit"
        listId={listId}
        initialData={{
          title: currentListData.title,
          emoji: currentListData.emoji,
          description: currentListData.description,
          visibility: currentListData.visibility,
          tags: currentListData.tags,
        }}
        onSave={handleSaveEditList}
        onClose={() => editListBottomSheetRef.current?.close()}
      />

      {/* Place Details Bottom Sheet */}
      <PlaceDetailsBottomSheetPortal
        ref={placeDetailsBottomSheetRef}
        place={selectedPlace}
        onClose={handlePlaceDetailsClose}
        onSavePlace={(place) => {
          // Handle save place action
        }}
        onReserveTable={(place) => {
          // Handle reserve table action
          Alert.alert('Reservar Mesa', `Reservar mesa no ${place.googleData.name}?`, [
            { text: 'Cancelar' },
            { text: 'Reservar' },
          ]);
        }}
        onShowOnMap={(place) => {
          // Handle show on map action          
        }}
      />
    </View>
  );
};

export default ListPlacesScreen;
