import Header from '@/components/Header';
import { AddPlaceBottomSheetPortal, type BottomSheetRef } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Place {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  category: string;
  cuisine?: string;
  rating: number;
  distance: string;
  image: string;
  isOpen?: boolean;
}

interface PlaceCardProps {
  place: Place;
  onPress?: () => void;
  onDelete?: () => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onPress, onDelete }) => {
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
            source={{ uri: place.image }}
            className="w-full h-full"
            style={{ resizeMode: 'cover' }}
          />
        </View>

        {/* Place Info */}
        <View className="flex-1">
          {/* Name and Status */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
              {place.name}
            </Text>
            {place.isOpen !== undefined && (
              <View className="flex-row items-center">
                <View 
                  className={`w-2 h-2 rounded-full mr-1 ${
                    place.isOpen ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <Text className={`text-xs ${place.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                  {place.isOpen ? 'Aberto' : 'Fechado'}
                </Text>
              </View>
            )}
          </View>

          {/* Price and Category */}
          <View className="flex-row items-center mb-2">
            <Text className="text-sm font-medium text-gray-600">
              {place.priceRange}
            </Text>
            <Text className="text-sm text-gray-500 mx-2">•</Text>
            <Text className="text-sm text-gray-600">
              {place.category}
            </Text>
            {place.cuisine && (
              <>
                <Text className="text-sm text-gray-500 mx-2">•</Text>
                <Text className="text-sm text-gray-600">
                  {place.cuisine}
                </Text>
              </>
            )}
          </View>

          {/* Description */}
          <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
            {place.description}
          </Text>

          {/* Rating and Distance */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#FCD34D" />
              <Text className="text-sm font-medium text-gray-700 ml-1">
                {place.rating}
              </Text>
              <View className="flex-row items-center ml-4">
                <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                <Text className="text-sm text-gray-500 ml-1">
                  {place.distance}
                </Text>
              </View>
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

  // Get list data from params or mock data
  const listId = params.listId as string;
  const listTitle = params.title as string || 'Lista';
  const listEmoji = params.emoji as string || '🍽️';
  const listDescription = params.description as string || '';
  const placesCount = params.placesCount as string || '0';
  const isPublic = params.isPublic === 'true';

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

  const handlePlacePress = (placeId: string) => {
    // TODO: Navigate to place details
    console.log('Navigate to place:', placeId);
  };

  const handleDeletePlace = (placeId: string) => {
    // TODO: Implement delete place functionality
    console.log('Delete place:', placeId);
  };

  const handleSavePlace = (placeData: any) => {
    // TODO: Implement save place functionality
    console.log('Save place to list:', placeData);
  };

  // Mock places data
  const places: Place[] = [
    {
      id: '1',
      name: "MONTY'S GOOD BURGER",
      description: 'Hambúrgueres artesanais com ingredientes premium',
      priceRange: '$$',
      category: 'American',
      cuisine: 'Quick',
      rating: 5.9,
      distance: '0.5 km',
      image: 'https://via.placeholder.com/64x64/8B4513/FFFFFF?text=🍔',
      isOpen: true,
    },
    {
      id: '2',
      name: 'BURGER & CIA',
      description: 'Ambiente descontraído com hambúrgueres criativos',
      priceRange: '$$',
      category: 'American',
      cuisine: 'Gourmet',
      rating: 4.6,
      distance: '0.8 km',
      image: 'https://via.placeholder.com/64x64/8B4513/FFFFFF?text=🍔',
      isOpen: true,
    },
    {
      id: '3',
      name: 'THE BURGER JOINT',
      description: 'Experiência premium em hambúrgueres',
      priceRange: '$$$',
      category: 'American',
      cuisine: 'Premium',
      rating: 4.8,
      distance: '1.2 km',
      image: 'https://via.placeholder.com/64x64/8B4513/FFFFFF?text=🍔',
      isOpen: false,
    },
  ];

  const getSortedPlaces = () => {
    switch (sortBy) {
      case 'rating':
        return [...places].sort((a, b) => b.rating - a.rating);
      case 'distance':
        return [...places].sort((a, b) => 
          parseFloat(a.distance) - parseFloat(b.distance)
        );
      case 'recent':
      default:
        return places;
    }
  };

  const sortedPlaces = getSortedPlaces();

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
          {sortedPlaces.length > 0 ? (
            sortedPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onPress={() => handlePlacePress(place.id)}
                onDelete={() => handleDeletePlace(place.id)}
              />
            ))
          ) : (
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
