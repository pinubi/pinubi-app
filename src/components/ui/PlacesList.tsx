import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { SerperPlace } from '@/types/places';

interface PlacesListProps {
  places: SerperPlace[];
  onPlacePress: (place: SerperPlace) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const PlaceCard: React.FC<{
  place: SerperPlace;
  onPress: (place: SerperPlace) => void;
}> = ({ place, onPress }) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(place)}
      className="bg-white rounded-2xl p-4 mx-2 mb-3 flex-row items-center shadow-sm border border-gray-100"
    >
      {/* Place icon */}
      <View className="w-14 h-14 bg-primary-500 rounded-2xl items-center justify-center mr-4">
        <Ionicons name="location" size={24} color="white" />
      </View>

      {/* Place info */}
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-900 mb-1" numberOfLines={1}>
          {place.title}
        </Text>
        
        <Text className="text-gray-600 text-sm mb-2" numberOfLines={1}>
          {place.address}
        </Text>
        
        <View className="flex-row items-center">
          {place.rating && (
            <View className="flex-row items-center mr-4">
              <Ionicons name="star" size={14} color="#FFA500" />
              <Text className="text-sm text-gray-700 ml-1">{place.rating}</Text>
            </View>
          )}
          {place.category && (
            <View className="flex-row items-center">
              <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1" numberOfLines={1}>
                {place.category}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

const PlacesList: React.FC<PlacesListProps> = ({
  places,
  onPlacePress,
  loading = false,
  emptyMessage = 'Nenhum lugar encontrado',
}) => {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-gray-600 text-center">Carregando lugares...</Text>
      </View>
    );
  }

  if (places.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Ionicons name="location-outline" size={48} color="#D1D5DB" />
        <Text className="text-gray-600 text-center mt-4">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={places}
      keyExtractor={(item, index) => `${item.title}-${index}`}
      renderItem={({ item }) => (
        <PlaceCard place={item} onPress={onPlacePress} />
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};

export default PlacesList;
