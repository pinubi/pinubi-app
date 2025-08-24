import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Text, View } from 'react-native';

import PinubiMapView from '@/components/PinubiMapView';
import {
    BottomSheet,
    FilterTabs,
    Header,
    PlacesList,
    ProfileBottomSheet,
    SearchInput,
    ViewModeDropdown,
    type BottomSheetRef,
    type ViewMode
} from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { Place } from '@/types/places';

const DiscoverScreen = () => {
  const { userPhoto } = useAuth();
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const profileBottomSheetRef = useRef<BottomSheetRef>(null);
  const [activeTab, setActiveTab] = useState<'amigos' | 'tendencias' | 'reservas'>('amigos');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [bottomSheetIndex, setBottomSheetIndex] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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
  
  // Mock data for demonstration - replace with real data
  const [places] = useState<Place[]>([
    {
      id: 'place-1',
      googleData: {
        name: 'Café da Manhã',
        address: 'Rua das Flores, 123 - Centro',
        coordinates: { lat: -23.550520, lng: -46.633308 },
        rating: 4.5,
        types: ['cafe', 'restaurant']
      },
      coordinates: { lat: -23.550520, lng: -46.633308 },
      categories: ['cafe']
    },
    {
      id: 'place-2',
      googleData: {
        name: 'Restaurante Italiano',
        address: 'Av. Paulista, 456 - Bela Vista',
        coordinates: { lat: -23.561684, lng: -46.656139 },
        rating: 4.8,
        types: ['restaurant', 'italian']
      },
      coordinates: { lat: -23.561684, lng: -46.656139 },
      categories: ['italian', 'restaurant']
    },
    {
      id: 'place-3',
      googleData: {
        name: 'Parque Ibirapuera',
        address: 'Av. Pedro Álvares Cabral - Vila Mariana',
        coordinates: { lat: -23.587416, lng: -46.657834 },
        rating: 4.6,
        types: ['park']
      },
      coordinates: { lat: -23.587416, lng: -46.657834 },
      categories: ['park']
    }
  ]);

  const tabs = [
    { id: 'amigos' as const, label: 'Lista da Pinubi', icon: 'star' as const },
    { id: 'tendencias' as const, label: 'Em Alta', icon: 'flame' as const },
    { id: 'reservas' as const, label: 'Meus Locais', icon: 'bookmark' as const },
  ];

  const handleProfilePress = () => {
    profileBottomSheetRef.current?.snapToIndex(0);
  };

  const handleSearchFocus = useCallback(() => {
    // Expand bottom sheet to full height when search is focused
    bottomSheetRef.current?.snapToIndex(2);
  }, []);

  const handleSearchBlur = useCallback(() => {
    // Optionally collapse to middle position when search loses focus
    if (searchQuery.length === 0) {
      bottomSheetRef.current?.snapToIndex(0);
    }
  }, [searchQuery]);

  const handleBottomSheetChange = useCallback((index: number) => {
    // Prevent sheet changes when keyboard is visible (except allowing top position)
    if (isKeyboardVisible && index !== 2) {
      bottomSheetRef.current?.snapToIndex(2);
      return;
    }
    setBottomSheetIndex(index);
  }, [isKeyboardVisible]);

  const handlePlacePress = (place: Place) => {
    // TODO: Implement place details modal or navigation
    Alert.alert(
      place.googleData.name,
      `${place.googleData.address}\n\n${place.googleData.rating ? `⭐ ${place.googleData.rating}` : ''}${place.categories?.length ? `\n📍 ${place.categories.join(', ')}` : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ver Detalhes', onPress: () => console.log('Ver detalhes:', place) },
        { text: 'Salvar Local', onPress: () => console.log('Salvar local:', place) },
      ]
    );
  };

  // Filter places based on search query
  const filteredPlaces = places.filter(place =>
    place.googleData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    place.googleData.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    place.categories?.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderContent = () => {
    if (viewMode === 'map') {
      return <PinubiMapView onPlacePress={handlePlacePress} />;
    }

    // Render list view with API test for debugging
    return (
      <View className="flex-1 p-4">
        <Text className="text-center text-gray-600 mt-8">
          Lista de lugares será implementada aqui
        </Text>
      </View>
    );
  };

  const renderBottomSheetContent = () => {
    return (
      <View className="flex-1 bg-white">
        {/* Search Input - Always visible */}
        <View className="p-2">
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholder="Buscar lugares incríveis..."
          />
        </View>
        
        {/* Content Area - Always present but may be clipped at first snap point */}
        <View className="flex-1 px-2">
          {/* Header for places list */}
          <View className="px-2 py-2 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-1">
              {searchQuery ? 'Resultados da busca' : 'Lugares recomendados'}
            </Text>
            <Text className="text-sm text-gray-600">
              {filteredPlaces.length} {filteredPlaces.length === 1 ? 'lugar encontrado' : 'lugares encontrados'}
            </Text>
          </View>
          
          {/* Places List */}
          <View className="flex-1 mt-2">
            <PlacesList
              places={filteredPlaces}
              onPlacePress={handlePlacePress}
              emptyMessage={
                searchQuery 
                  ? 'Nenhum lugar encontrado para sua busca' 
                  : 'Nenhum lugar recomendado no momento'
              }
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <Header
        leftElement={
          <ViewModeDropdown
            selectedMode={viewMode}
            onModeChange={setViewMode}
          />
        }
        userPhoto={userPhoto}
        onRightPress={handleProfilePress}
      />

      {/* Filter tabs */}
      <FilterTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content based on view mode */}
      <View className="flex-1">
        {renderContent()}
        
        {/* Bottom Sheet - only show in map mode */}
        {viewMode === 'map' && (
          <BottomSheet
            ref={bottomSheetRef}
            snapPoints={['30%', '65%', '98%']}
            index={bottomSheetIndex}
            onChange={handleBottomSheetChange}
            enablePanDownToClose={false}
            enableHandlePanningGesture={!isKeyboardVisible}
            enableContentPanningGesture={true}
          >
            {renderBottomSheetContent()}
          </BottomSheet>
        )}
      </View>

      {/* Profile Bottom Sheet */}
      <ProfileBottomSheet
        ref={profileBottomSheetRef}
        onClose={() => profileBottomSheetRef.current?.close()}
      />
    </View>
  );
};

export default DiscoverScreen;
