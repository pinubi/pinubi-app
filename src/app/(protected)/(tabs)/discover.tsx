import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

import PinubiMapView from '@/components/PinubiMapView';
import SerperTestComponent from '@/components/SerperTestComponent';
import { FilterTabs, Header, ViewModeDropdown, type ViewMode } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { SerperPlace } from '@/types/places';

interface Place {
  id: string;
  name: string;
  category: string;
  status: 'open' | 'closed';
  rating: number;
  distance: string;
  emoji: string;
}

const DiscoverScreen = () => {
  const { userPhoto } = useAuth();
  const [activeTab, setActiveTab] = useState<'amigos' | 'tendencias' | 'reservas'>('amigos');
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  const tabs = [
    { id: 'amigos' as const, label: 'Amigos', icon: 'people' as const },
    { id: 'tendencias' as const, label: 'Tendências', icon: 'trending-up' as const },
    { id: 'reservas' as const, label: 'Reservas', icon: 'calendar' as const },
  ];

  const handleProfilePress = () => {
    // Navigate to profile or show profile menu
    console.log('Profile pressed');
  };

  const handlePlacePress = (place: SerperPlace) => {
    // TODO: Implement place details modal or navigation
    Alert.alert(
      place.title,
      `${place.address}\n\n${place.rating ? `⭐ ${place.rating}` : ''}${place.category ? `\n📍 ${place.category}` : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ver Detalhes', onPress: () => console.log('Ver detalhes:', place) },
        { text: 'Salvar Local', onPress: () => console.log('Salvar local:', place) },
      ]
    );
  };

  const renderPlaceCard = (place: Place) => (
    <TouchableOpacity
      key={place.id}
      className="bg-white rounded-2xl p-4 mb-4 flex-row items-center shadow-sm border border-gray-100"
    >
      {/* Place emoji/icon */}
      <View className="w-16 h-16 bg-primary-500 rounded-2xl items-center justify-center mr-4">
        <Text className="text-2xl">{place.emoji}</Text>
      </View>

      {/* Place info */}
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-lg font-semibold text-gray-900 mr-2">
            {place.name}
          </Text>
          <View className={`px-2 py-1 rounded-full ${
            place.status === 'open' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Text className={`text-xs font-medium ${
              place.status === 'open' ? 'text-green-600' : 'text-red-600'
            }`}>
              {place.status === 'open' ? 'Aberto' : 'Fechado'}
            </Text>
          </View>
        </View>
        
        <Text className="text-gray-600 text-sm mb-2">{place.category}</Text>
        
        <View className="flex-row items-center">
          <View className="flex-row items-center mr-4">
            <Ionicons name="star" size={14} color="#FFA500" />
            <Text className="text-sm text-gray-700 ml-1">{place.rating}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">{place.distance}</Text>
          </View>
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (viewMode === 'map') {
      return <PinubiMapView onPlacePress={handlePlacePress} />;
    }

    // Render list view with API test for debugging
    return (
      <View className="flex-1 p-4">
        {__DEV__ ? (
          <SerperTestComponent />
        ) : (
          <Text className="text-center text-gray-600 mt-8">
            Lista de lugares será implementada aqui
          </Text>
        )}
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
      {renderContent()}
    </View>
  );
};

export default DiscoverScreen;
