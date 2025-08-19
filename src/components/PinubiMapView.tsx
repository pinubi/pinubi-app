import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import { useLocation } from '@/hooks/useLocation';
import { usePlaces } from '@/hooks/usePlaces';
import { MapRegion, SerperPlace } from '@/types/places';

interface PinubiMapViewProps {
  onLocationRefresh?: () => void;
  onPlacePress?: (place: SerperPlace) => void;
}

const PinubiMapView: React.FC<PinubiMapViewProps> = ({ onLocationRefresh, onPlacePress }) => {
  const { latitude, longitude, error, loading, refreshLocation } = useLocation();
  const { places, loading: placesLoading, error: placesError, searchPlaces, clearError } = usePlaces();
  
  const [currentRegion, setCurrentRegion] = useState<MapRegion | null>(null);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [hasInitialSearch, setHasInitialSearch] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Automatic search when location is available
  useEffect(() => {
    if (latitude && longitude && !hasInitialSearch && !loading) {
      console.log('🎯 Performing initial search for food places at current location');
      searchPlaces(latitude, longitude, 'restaurantes comida', 14);
      setHasInitialSearch(true);
    }
  }, [latitude, longitude, hasInitialSearch, loading, searchPlaces]);

  const handleRegionChangeComplete = useCallback((region: Region) => {
    const newRegion: MapRegion = {
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    };
    
    setCurrentRegion(newRegion);
    
    // Show search button when user moves the map
    if (latitude && longitude) {
      const distanceFromUserLocation = Math.abs(region.latitude - latitude) + Math.abs(region.longitude - longitude);
      setShowSearchButton(distanceFromUserLocation > 0.001); // Show if moved significantly
    }
  }, [latitude, longitude]);

  const handleSearchInArea = useCallback(async () => {
    if (!currentRegion) return;
    
    console.log('🔍 Searching in area:', currentRegion);
    clearError();
    setShowSearchButton(false);
    
    // Calculate zoom level based on latitudeDelta
    let zoom = 14;
    if (currentRegion.latitudeDelta > 0.1) zoom = 10;
    else if (currentRegion.latitudeDelta > 0.05) zoom = 12;
    else if (currentRegion.latitudeDelta < 0.005) zoom = 16;
    
    console.log('🎯 Search params:', {
      lat: currentRegion.latitude,
      lng: currentRegion.longitude,
      zoom,
      query: 'restaurantes comida'
    });
    
    await searchPlaces(
      currentRegion.latitude,
      currentRegion.longitude,
      'restaurantes comida',
      zoom
    );
  }, [currentRegion, searchPlaces, clearError]);

  const handlePlacePress = useCallback((place: SerperPlace) => {
    onPlacePress?.(place);
  }, [onPlacePress]);

  // Function to get appropriate food emoji based on place category/type
  const getFoodEmoji = useCallback((place: SerperPlace): string => {
    const title = place.title?.toLowerCase() || '';
    const category = place.category?.toLowerCase() || '';
    
    // Pizza places
    if (title.includes('pizza') || category.includes('pizza')) return '🍕';
    
    // Coffee/Cafes
    if (title.includes('café') || title.includes('coffee') || category.includes('café') || category.includes('coffee')) return '☕';
    
    // Sushi/Japanese
    if (title.includes('sushi') || title.includes('japonês') || category.includes('sushi') || category.includes('japonês')) return '�';
    
    // Italian
    if (title.includes('italiano') || category.includes('italiano')) return '🍝';
    
    // Bakery/Padaria/Dessert
    if (title.includes('padaria') || title.includes('bakery') || title.includes('bistrô') || title.includes('armazém') || category.includes('padaria')) return '�';
    
    // Fast food/Burger
    if (title.includes('lanche') || title.includes('burger') || title.includes('hambúrguer') || category.includes('fast food')) return '🍔';
    
    // Ice cream
    if (title.includes('sorvete') || title.includes('ice cream') || category.includes('sorvete')) return '🍦';
    
    // Chinese
    if (title.includes('chinês') || title.includes('chinese') || category.includes('chinês')) return '🥡';
    
    // Barbecue/Churrasco
    if (title.includes('churrasco') || title.includes('barbecue') || category.includes('churrasco') || category.includes('carne')) return '🥩';
    
    // Mexican
    if (title.includes('mexicano') || category.includes('mexicano')) return '🌮';
    
    // Lebanese/Middle Eastern
    if (title.includes('libanês') || title.includes('árabe') || category.includes('libanês') || category.includes('árabe')) return '�';
    
    // Bar/Drinks
    if (title.includes('bar') || category.includes('bar')) return '🍺';
    
    // Default food emoji for restaurants
    return '🍽️';
  }, []);

  const handleRefreshLocation = () => {
    // Animate map camera back to current location with dramatic zoom effect
    if (mapRef.current && latitude && longitude) {
      // First: Zoom out to show a wider area
      mapRef.current.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05, // Zoom out first
        longitudeDelta: 0.05,
      }, 800);
      
      // Then: Zoom back in to the precise location after a delay
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01, // Zoom back in
            longitudeDelta: 0.01,
          }, 1000);
        }
      }, 900); // Start second animation after first one completes
    }
    
    setShowSearchButton(false);
    setCurrentRegion(null);
    onLocationRefresh?.();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-primary-50">
        <ActivityIndicator size="large" color="#b13bff" />
        <Text className="text-primary-600 mt-4">Obtendo sua localização...</Text>
      </View>
    );
  }

  if (error || !latitude || !longitude) {
    return (
      <View className="flex-1 items-center justify-center bg-primary-50 p-6">
        <Ionicons name="location-outline" size={64} color="#b13bff" />
        <Text className="text-primary-800 text-lg font-semibold mt-4 text-center">
          Não foi possível obter sua localização
        </Text>
        <Text className="text-primary-600 text-center mt-2">
          {error || 'Verifique as permissões do aplicativo'}
        </Text>
        <TouchableOpacity
          onPress={handleRefreshLocation}
          className="bg-primary-500 px-6 py-3 rounded-xl mt-6"
        >
          <Text className="text-white font-semibold">Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        userInterfaceStyle="light"
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        mapType="standard"
        showsBuildings={false}
        showsIndoors={false}
        showsPointsOfInterest={false}
        showsTraffic={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {/* Custom marker for user's current location */}
        <Marker
          coordinate={{ latitude, longitude }}
          title="Você está aqui"
          description="Sua localização atual"
        >
          <View className="relative">
            {/* Outer glow effect */}
            <View className="absolute w-12 h-12 bg-primary-500/20 rounded-full -top-2 -left-2" />
            {/* Main marker */}
            <View className="w-8 h-8 bg-primary-500 rounded-full items-center justify-center border-2 border-white shadow-lg">
              <View className="w-3 h-3 bg-white rounded-full" />
            </View>
          </View>
        </Marker>

        {/* Places markers */}
        {places.map((place) => (
          <Marker
            key={place.placeId}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            // title={place.title}
            // description={place.address}
            onPress={() => handlePlacePress(place)}
          >
            <View className="relative">
              {/* Food place marker with emoji */}
              <View className="w-12 h-12 bg-primary-500 rounded-full items-center justify-center shadow-lg">
                <Text style={{ fontSize: 24 }}>{getFoodEmoji(place)}</Text>
              </View>
              {/* Rating badge if available */}
              {place.rating && (
                <View className="absolute -top-1 -right-1 bg-white rounded-full px-1.5 py-0.5 border border-gray-200 min-w-[20px]">
                  <Text className="text-xs font-bold text-gray-700 text-center">
                    {place.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Search in area button */}
      {showSearchButton && (
        <View className="absolute top-6 left-0 right-0 items-center">
          <TouchableOpacity
            onPress={handleSearchInArea}
            disabled={placesLoading}
            className="bg-white px-6 py-3 rounded-full flex-row items-center shadow-lg border border-primary-100"
            style={{
              shadowColor: '#b13bff',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            {placesLoading ? (
              <>
                <ActivityIndicator size="small" color="#b13bff" />
                <Text className="text-primary-600 font-semibold ml-2">Buscando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="search" size={20} color="#b13bff" />
                <Text className="text-primary-600 font-semibold ml-2">Buscar comida na área</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Error message for places */}
      {placesError && (
        <View className="absolute top-6 left-4 right-4">
          <View className="bg-red-100 border border-red-200 rounded-lg p-3 flex-row items-center">
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
            <Text className="text-red-700 flex-1 ml-2">{placesError}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Debug info - Remove in production */}
      {__DEV__ && (
        <View className="absolute bottom-20 left-4 bg-black/70 p-2 rounded">
          <Text className="text-white text-xs">Places: {places.length}</Text>
          <Text className="text-white text-xs">Loading: {placesLoading ? 'YES' : 'NO'}</Text>
          <Text className="text-white text-xs">Show Button: {showSearchButton ? 'YES' : 'NO'}</Text>
          {placesError && (
            <Text className="text-red-300 text-xs">Error: {placesError}</Text>
          )}
        </View>
      )}

      {/* Refresh location button */}
      <TouchableOpacity
        onPress={handleRefreshLocation}
        className="absolute top-6 right-6 w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg border border-primary-100"
        style={{
          shadowColor: '#b13bff',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Ionicons name="locate" size={24} color="#b13bff" />
      </TouchableOpacity>
    </View>
  );
};

export default PinubiMapView;