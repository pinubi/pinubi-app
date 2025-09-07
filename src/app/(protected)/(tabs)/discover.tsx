import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Text, View } from 'react-native';

import PinubiMapView from '@/components/PinubiMapView';
import {
  AutocompleteList,
  BottomSheet,
  FilterTabs,
  Header,
  PlaceDetailsBottomSheetPortal,
  PlacesList,
  ProfileBottomSheetPortal,
  SearchInput,
  ViewModeDropdown,
  type BottomSheetRef,
  type ViewMode,
} from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { useLists } from '@/hooks/useLists';
import { firebaseService } from '@/services/firebaseService';
import { AutocompleteResult } from '@/types/googlePlaces';
import { ListPlaceWithDetails } from '@/types/lists';
import { Place } from '@/types/places';

const DiscoverScreen = () => {
  const { userPhoto } = useAuth();
  const { favoritesList, getListPlaces } = useLists();
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const profileBottomSheetRef = useRef<BottomSheetRef>(null);
  const placeDetailsBottomSheetRef = useRef<BottomSheetRef>(null);
  const [activeTab, setActiveTab] = useState<'pinubi' | 'hype' | 'places'>('pinubi');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Google Places Autocomplete
  const {
    results: autocompleteResults,
    loading: autocompleteLoading,
    error: autocompleteError,
    search: searchAutocomplete,
    clearResults: clearAutocompleteResults,
    isApiAvailable,
  } = useGooglePlacesAutocomplete({
    debounceDelay: 300,
    minCharacters: 3,
  });

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      // Force BottomSheet to top position when keyboard opens
      bottomSheetRef.current?.snapToIndex(2);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Check if we need to reopen profile bottom sheet when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const checkReopenFlag = async () => {
        try {
          const shouldReopen = await AsyncStorage.getItem('shouldReopenProfileBottomSheet');
          if (shouldReopen === 'true') {
            // Clear the flag
            await AsyncStorage.removeItem('shouldReopenProfileBottomSheet');
            // Reopen the profile bottom sheet with a small delay
            setTimeout(() => {
              profileBottomSheetRef.current?.snapToIndex(0);
            }, 100);
          }
        } catch (error) {
          console.error('Error checking reopen flag:', error);
        }
      };

      checkReopenFlag();
    }, [])
  );

  // User's favorite places - fetched from favorites list
  const [places, setPlaces] = useState<Place[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Helper function to convert ListPlaceWithDetails to Place
  const convertListPlaceToPlace = (listPlace: ListPlaceWithDetails): Place | null => {
    if (!listPlace.place) return null;

    return {
      id: listPlace.place.id,
      googleData: {
        name: listPlace.place.name,
        address: listPlace.place.address,
        coordinates: listPlace.place.coordinates,
        rating: listPlace.place.rating,
        photos: listPlace.place.photos,
        types: listPlace.place.types,
        phone: listPlace.place.phone,
        website: listPlace.place.website,
        priceLevel: listPlace.place.priceLevel,
      },
      coordinates: listPlace.place.coordinates,
      categories: listPlace.place.types || [],
    };
  };

  // Fetch places from favorites list
  const fetchFavoritesPlaces = useCallback(async () => {
    if (!favoritesList?.id) {
      setPlaces([]);
      return;
    }

    try {
      setFavoritesLoading(true);
      const listPlaces = await getListPlaces(favoritesList.id);

      // Convert ListPlaceWithDetails to Place[]
      const convertedPlaces = listPlaces.map(convertListPlaceToPlace).filter((place): place is Place => place !== null);

      setPlaces(convertedPlaces);
    } catch (error) {
      console.error('Error fetching favorites places:', error);
      setPlaces([]);
    } finally {
      setFavoritesLoading(false);
    }
  }, [favoritesList?.id, getListPlaces]);

  // Fetch favorites places when favorites list is available
  useEffect(() => {
    fetchFavoritesPlaces();
  }, [fetchFavoritesPlaces]);

  const tabs = [
    { id: 'pinubi' as const, label: 'Lista da Pinubi', icon: 'star' as const },
    { id: 'hype' as const, label: 'Em Alta', icon: 'flame' as const },
    { id: 'places' as const, label: 'Meus Lugares', icon: 'bookmark' as const },
  ];

  const handleProfilePress = () => {
    profileBottomSheetRef.current?.snapToIndex(0);
  };

  const handleSearchFocus = useCallback(() => {
    // Expand bottom sheet to full height when search is focused
    setIsSearchFocused(true);
    setShowAutocomplete(true);
    bottomSheetRef.current?.snapToIndex(2);
  }, []);

  const handleSearchBlur = useCallback(() => {
    // Keep the sheet open if there's search content, otherwise allow collapse
    setIsSearchFocused(false);
    // Don't hide autocomplete immediately - let user select results
    // if (searchQuery.length === 0 && !isKeyboardVisible) {
    //   setShowAutocomplete(false);
    //   bottomSheetRef.current?.snapToIndex(0);
    // }
  }, [searchQuery, isKeyboardVisible]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);

      if (text.length >= 3 && isApiAvailable) {
        // Trigger autocomplete search
        setShowAutocomplete(true);
        searchAutocomplete(text);
      } else {
        // Clear autocomplete for short queries
        setShowAutocomplete(false);
        clearAutocompleteResults();
      }
    },
    [isApiAvailable, searchAutocomplete, clearAutocompleteResults]
  );

  const handleAutocompleteSelect = useCallback(
    async (result: AutocompleteResult) => {
      try {
        // Get full place details from Firebase
        const placeDetails = await firebaseService.getPlaceDetails(result.place_id);

        if (placeDetails.success && placeDetails.data) {
          // Set the selected place and the bottom sheet will open automatically
          setSelectedPlace(placeDetails.data);
        } else {
          // Show friendly error message
          Alert.alert('Local não encontrado', 'Não foi possível carregar os detalhes deste local no momento.', [
            { text: 'Ok', style: 'default' },
          ]);
        }
      } catch (error) {
        console.error('Error getting place details:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao buscar os detalhes do local.', [{ text: 'Ok', style: 'default' }]);
      }

      // Clear search and hide autocomplete
      setSearchQuery('');
      setShowAutocomplete(false);
      clearAutocompleteResults();

      // Collapse bottom sheet
      bottomSheetRef.current?.snapToIndex(0);
    },
    [clearAutocompleteResults]
  );

  // const handleBottomSheetChange = useCallback((index: number) => {
  //   // Prevent sheet changes when keyboard is visible or search is focused (except allowing top position)
  //   if ((isSearchFocused) && index !== 2) {
  //     bottomSheetRef.current?.snapToIndex(2);
  //     return;
  //   }
  //   setBottomSheetIndex(index);
  // }, [isKeyboardVisible, isSearchFocused]);

  const handlePlacePress = (place: Place) => {
    // Set the selected place and the bottom sheet will open automatically
    setSelectedPlace(place);

    bottomSheetRef.current?.close();

    setTimeout(() => {
      placeDetailsBottomSheetRef.current?.snapToIndex(1);
    }, 1000);
  };

  // Place details action handlers
  const handleSavePlace = useCallback((place: Place) => {
    // TODO: Implement save place functionality
    Alert.alert('Local Salvo', `${place.googleData.name} foi salvo em suas listas!`);
  }, []);

  const handleReserveTable = useCallback((place: Place) => {
    // TODO: Implement reservation functionality
    Alert.alert('Reservar Mesa', `Deseja reservar uma mesa no ${place.googleData.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => console.log('Reservation confirmed') },
    ]);
  }, []);

  const handleShowOnMap = useCallback((place: Place) => {
    // TODO: Implement show on map functionality
    setViewMode('map');
    placeDetailsBottomSheetRef.current?.close();
  }, []);

  const handlePlaceDetailsClose = useCallback(() => {
    setSelectedPlace(null);
    setBottomSheetIndex(0);
    setTimeout(() => {
      bottomSheetRef.current?.collapse();
    }, 500);
  }, []);

  // Filter places based on search query
  const filteredPlaces = places.filter((place) => {
    const addressText =
      typeof place.googleData.address === 'object' && (place.googleData.address as any)?.formatted
        ? (place.googleData.address as any).formatted
        : typeof place.googleData.address === 'string'
          ? place.googleData.address
          : '';

    return (
      place.googleData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addressText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.categories?.some((cat) => cat.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const renderContent = () => {
    if (viewMode === 'map') {
      return <PinubiMapView onPlacePress={handlePlacePress} />;
    }

    // Render list view with API test for debugging
    return (
      <View className='flex-1 p-4'>
        <Text className='text-center text-gray-600 mt-8'>Lista de lugares será implementada aqui</Text>
      </View>
    );
  };

  const renderBottomSheetContent = () => {
    return (
      <View className='flex-1 bg-white'>
        {/* Search Input - Always visible */}
        <View className='p-2'>
          <SearchInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholder='Buscar lugares incríveis...'
            loading={autocompleteLoading}
          />
        </View>

        {/* Content Area - Show autocomplete or places list */}
        <View className='flex-1 px-2'>
          {showAutocomplete ? (
            // Show autocomplete results
            <AutocompleteList
              results={autocompleteResults}
              onResultPress={handleAutocompleteSelect}
              loading={autocompleteLoading}
              error={autocompleteError}
              emptyMessage={
                searchQuery.length < 3
                  ? 'Digite pelo menos 3 caracteres para buscar...'
                  : !isApiAvailable
                    ? 'Busca indisponível no momento'
                    : 'Nenhum lugar encontrado para sua busca'
              }
            />
          ) : (
            // Show regular places list
            <>
              {/* Header for places list */}
              <View className='px-2 py-2 border-b border-gray-100'>
                <Text className='text-lg font-semibold text-gray-900 mb-1'>
                  {searchQuery ? 'Resultados da busca' : 'Seus lugares favoritos'}
                </Text>
                <Text className='text-sm text-gray-600'>
                  {filteredPlaces.length} {filteredPlaces.length === 1 ? 'lugar encontrado' : 'lugares encontrados'}
                </Text>
              </View>

              {/* Places List */}
              <View className='flex-1 mt-2'>
                <PlacesList
                  places={filteredPlaces}
                  onPlacePress={handlePlacePress}
                  emptyMessage={
                    searchQuery ? 'Nenhum lugar encontrado para sua busca' : 'Nenhum lugar recomendado no momento'
                  }
                />
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderBottomSheetMapMode = useMemo(() => {
    {
      /* Bottom Sheet - only show in map mode */
    }
    return (
      viewMode === 'map' && (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={['30%', '65%', '98%']}
          index={bottomSheetIndex}
          // onChange={handleBottomSheetChange}
          enablePanDownToClose={false}
          enableContentPanningGesture={true}
        >
          {renderBottomSheetContent()}
        </BottomSheet>
      )
    );
  }, [selectedPlace, viewMode, renderBottomSheetContent, bottomSheetIndex]);

  return (
    <View className='flex-1 bg-gray-50'>
      {/* Header */}
      <Header
        leftElement={<ViewModeDropdown selectedMode={viewMode} onModeChange={setViewMode} />}
        userPhoto={userPhoto}
        onRightPress={handleProfilePress}
      />

      {/* Filter tabs */}
      <FilterTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content based on view mode */}
      <View className='flex-1'>
        {renderContent()}

        {renderBottomSheetMapMode}
      </View>

      {/* Profile Bottom Sheet */}
      <ProfileBottomSheetPortal ref={profileBottomSheetRef} onClose={() => profileBottomSheetRef.current?.close()} />

      {/* Place Details Bottom Sheet */}
      <PlaceDetailsBottomSheetPortal
        ref={placeDetailsBottomSheetRef}
        place={selectedPlace}
        onClose={handlePlaceDetailsClose}
        onSavePlace={handleSavePlace}
        onReserveTable={handleReserveTable}
        onShowOnMap={handleShowOnMap}
      />
    </View>
  );
};

export default DiscoverScreen;
