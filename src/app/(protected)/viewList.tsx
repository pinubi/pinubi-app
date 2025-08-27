import Header from '@/components/Header';
import { AddPlaceBottomSheetPortal, type BottomSheetRef } from '@/components/ui';
import { useListPlaces } from '@/hooks/useListPlaces';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import type { AddPlaceToListRequest, ListPlaceWithDetails } from '@/types/lists';

interface PlaceCardProps {
  place: ListPlaceWithDetails;
  onPress?: () => void;
  onDelete?: () => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onPress, onDelete }) => {
  const placeData = place.place;
  
  if (!placeData) {
    return null; // Skip places without place data
  }

  // Helper to get first photo or placeholder
  const getPlaceImage = () => {
    if (placeData.photos && placeData.photos.length > 0) {
      return placeData.photos[0];
    }
    return 'https://via.placeholder.com/64x64/8B4513/FFFFFF?text=🍽️';
  };

  // Helper to format price level
  const getPriceRange = () => {
    if (!placeData.priceLevel) return '$';
    return '$'.repeat(placeData.priceLevel);
  };

  // Helper to get primary category
  const getCategory = () => {
    if (placeData.types && placeData.types.length > 0) {
      const primaryType = placeData.types[0];
      // Convert common types to readable format
      const typeMap: Record<string, string> = {
        'restaurant': 'Restaurante',
        'food': 'Comida',
        'establishment': 'Estabelecimento',
        'meal_takeaway': 'Delivery',
        'cafe': 'Café',
        'bar': 'Bar',
        'bakery': 'Padaria'
      };
      return typeMap[primaryType] || primaryType;
    }
    return 'Lugar';
  };
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100"
      style={{ elevation: 2 }}
    >
      <View className="flex-row p-4">
        {/* Place Image */}
        <View className="w-16 h-16 rounded-xl bg-gray-200 mr-4 overflow-hidden">
          <Image
            source={{ uri: getPlaceImage() }}
            className="w-full h-full"
            style={{ resizeMode: 'cover' }}
          />
        </View>

        {/* Place Info */}
        <View className="flex-1">
          {/* Name */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
              {placeData.name}
            </Text>
          </View>

          {/* Price and Category */}
          <View className="flex-row items-center mb-2">
            <Text className="text-sm font-medium text-gray-600">
              {getPriceRange()}
            </Text>
            <Text className="text-sm text-gray-500 mx-2">•</Text>
            <Text className="text-sm text-gray-600">
              {getCategory()}
            </Text>
          </View>

          {/* Personal Note or Address */}
          <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
            {place.personalNote || placeData.address}
          </Text>

          {/* Rating and Tags */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              {placeData.rating && (
                <>
                  <Ionicons name="star" size={16} color="#FCD34D" />
                  <Text className="text-sm font-medium text-gray-700 ml-1">
                    {placeData.rating.toFixed(1)}
                  </Text>
                </>
              )}
              
              {place.tags && place.tags.length > 0 && (
                <View className="flex-row items-center ml-4">
                  <Ionicons name="pricetag-outline" size={16} color="#9CA3AF" />
                  <Text className="text-sm text-gray-500 ml-1">
                    {place.tags.slice(0, 2).join(', ')}
                  </Text>
                </View>
              )}
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={onDelete}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
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

  // Get list data from params
  const listId = params.listId as string;
  const listTitle = params.title as string || 'Lista';
  const listEmoji = params.emoji as string || '🍽️';
  const listDescription = params.description as string || '';
  const isPublic = params.isPublic === 'true';

  // Use the list places hook
  const {
    places,
    placesCount,
    loading,
    error,
    addPlace,
    removePlace,
    refresh,
    clearError,
    hasPlaces,
    isEmpty
  } = useListPlaces(listId);

  // State for sorting
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'distance'>('recent');

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share list:', listId);
  };

  const handleMoreOptions = () => {
    // TODO: Implement more options (edit list, delete list, etc.)
    console.log('More options for list:', listId);
  };

  const handleAddPlace = () => {
    addPlaceBottomSheetRef.current?.snapToIndex(0);
  };

  const handlePlacePress = (place: ListPlaceWithDetails) => {
    // TODO: Navigate to place details
    console.log('Navigate to place:', place.placeId);
  };

  const handleDeletePlace = async (place: ListPlaceWithDetails) => {
    try {
      Alert.alert(
        'Remover lugar',
        `Deseja remover "${place.place?.name}" desta lista?`,
        [
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
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error removing place:', err);
      Alert.alert('Erro', 'Não foi possível remover o lugar. Tente novamente.');
    }
  };

  const handleSavePlace = async (placeData: AddPlaceToListRequest) => {
    try {
      console.log('🏗️ Adding place to list:', placeData);
      
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

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <Header
        title=""
        onLeftPress={handleBack}
        onRightPress={handleShare}
        rightIcon="share-outline"
        secondaryRightIcon="ellipsis-horizontal"
        onSecondaryRightPress={handleMoreOptions}
        className="bg-white border-b border-gray-100"
      />

      {/* Content */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* List Header */}
        <View className="bg-white px-4 py-6 border-b border-gray-100">
          <View className="items-center">
            <Text className="text-4xl mb-2">{listEmoji}</Text>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {listTitle} ({placesCount})
            </Text>
            
            {/* List Meta */}
            <View className="flex-row items-center mb-4">
              <View className="flex-row items-center">
                <Ionicons 
                  name={isPublic ? "globe-outline" : "person-outline"} 
                  size={16} 
                  color="#6B7280" 
                />
                <Text className="text-sm text-gray-600 ml-1">
                  por Você
                </Text>
              </View>
              <Text className="text-sm text-gray-500 mx-2">•</Text>
              <Text className="text-sm text-gray-600">
                15 de dezembro de 2024
              </Text>
            </View>

            {/* Description */}
            {listDescription && (
              <Text className="text-center text-gray-600 mb-4 leading-relaxed">
                {listDescription}
              </Text>
            )}

            {/* Add Place Button */}
            <TouchableOpacity
              onPress={handleAddPlace}
              className="w-full bg-primary-500 rounded-xl px-6 py-4 flex-row items-center justify-center"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Adicionar lugar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sort Options */}
        <View className="bg-white px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center justify-end">
            <TouchableOpacity
              onPress={() => {
                // TODO: Show sort options
                const options = ['recent', 'rating', 'distance'];
                const currentIndex = options.indexOf(sortBy);
                const nextIndex = (currentIndex + 1) % options.length;
                setSortBy(options[nextIndex] as any);
              }}
              className="flex-row items-center bg-gray-100 rounded-full px-3 py-2"
            >
              <Text className="text-sm text-gray-700 font-medium">
                {sortBy === 'recent' && 'Recente'}
                {sortBy === 'rating' && 'Avaliação'}
                {sortBy === 'distance' && 'Distância'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" className="ml-1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Places List */}
        <View className="px-4 py-4">
          {/* Loading State */}
          {loading && (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color='#F97316' />
              <Text className="text-gray-600 mt-4">Carregando lugares...</Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <Text className="text-red-800 font-medium">{error}</Text>
              <TouchableOpacity 
                onPress={clearError}
                className="mt-2"
              >
                <Text className="text-red-600 text-sm">Dispensar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Places Content */}
          {!loading && (
            <>
              {hasPlaces ? (
                sortedPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    onPress={() => handlePlacePress(place)}
                    onDelete={() => handleDeletePlace(place)}
                  />
                ))
              ) : (
                !error && (
                  <View className="items-center py-12">
                    <Text className="text-4xl mb-4">🍽️</Text>
                    <Text className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum lugar adicionado
                    </Text>
                    <Text className="text-gray-600 text-center mb-6">
                      Comece adicionando lugares que você quer visitar ou já visitou.
                    </Text>
                    <TouchableOpacity
                      onPress={handleAddPlace}
                      className="bg-primary-500 rounded-full px-6 py-3"
                    >
                      <Text className="text-white font-semibold">
                        Adicionar primeiro lugar
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              )}
            </>
          )}
        </View>

        {/* Bottom spacing */}
        <View className="h-6" />
      </ScrollView>

      {/* Add Place Bottom Sheet */}
      <AddPlaceBottomSheetPortal
        ref={addPlaceBottomSheetRef}
        listId={listId}
        onSave={handleSavePlace}
        onClose={() => addPlaceBottomSheetRef.current?.close()}
      />
    </View>
  );
};

export default ListPlacesScreen;
