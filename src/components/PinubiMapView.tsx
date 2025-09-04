import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { useLocation } from '@/hooks/useLocation';
import { usePlaces } from '@/hooks/usePlaces';
import { MapRegion, Place } from '@/types/places';

interface PinubiMapViewProps {
  onLocationRefresh?: () => void;
  onPlacePress?: (place: Place) => void;
}

const PinubiMapView: React.FC<PinubiMapViewProps> = ({ onLocationRefresh, onPlacePress }) => {
  const { latitude, longitude, error, loading, refreshLocation } = useLocation();
  const { places, loading: placesLoading, error: placesError, searchPlaces, clearError } = usePlaces();
  console.log("🚀 ~ PinubiMapView ~ places:", places)
  
  const [currentRegion, setCurrentRegion] = useState<MapRegion | null>(null);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [hasInitialSearch, setHasInitialSearch] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Check if running in Expo Go on iOS simulator
  const isExpoGoSimulator = Constants.appOwnership === 'expo' && Platform.OS === 'ios' && !Constants.isDevice;

  // Automatic search when location is available
  useEffect(() => {
    if (latitude && longitude && !hasInitialSearch && !loading) {
      console.log('🎯 Performing initial search for food places at current location');
      searchPlaces(latitude, longitude, 14);
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
      zoom
    );
  }, [currentRegion, searchPlaces, clearError]);

  const handlePlacePress = useCallback((place: Place) => {
    onPlacePress?.(place);
  }, [onPlacePress]);

  // Function to calculate distance between two coordinates in meters
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  // Function to get nearby places (within 50 meters of user location)
  const getNearbyPlaces = useCallback((): Place[] => {
    if (!latitude || !longitude || !places) return [];
    
    return places.filter(place => {
      const distance = calculateDistance(
        latitude, 
        longitude, 
        place.coordinates.lat, 
        place.coordinates.lng
      );
      return distance <= 50; // 50 meters threshold
    });
  }, [latitude, longitude, places, calculateDistance]);

  const handleUserLocationPress = useCallback(() => {
    const nearbyPlaces = getNearbyPlaces();
    
    if (nearbyPlaces.length === 1) {
      onPlacePress?.(nearbyPlaces[0]);
    } else if (nearbyPlaces.length > 1) {
      console.log('📍 Lugares próximos:', nearbyPlaces.map(p => p.googleData.name));
      
      // Optional: Show the first one or implement a selection modal
      // onPlacePress?.(nearbyPlaces[0]);
    }
  }, [getNearbyPlaces, onPlacePress]);

  // Function to get appropriate food emoji based on place category/type
  const getFoodEmoji = useCallback((place: Place): string => {
    const name = place.googleData.name?.toLowerCase() || '';
    const categories = place.categories?.join(' ').toLowerCase() || '';
    const types = place.googleData.types?.join(' ').toLowerCase() || '';
    const searchText = `${name} ${categories} ${types}`;
    
    // Pizza places
    if (searchText.includes('pizza')) return '🍕';
    
    // Coffee/Cafes
    if (searchText.includes('café') || searchText.includes('coffee')) return '☕';
    
    // Sushi/Japanese
    if (searchText.includes('sushi') || searchText.includes('japonês') || searchText.includes('japanese')) return '🍣';
    
    // Italian
    if (searchText.includes('italiano') || searchText.includes('italian')) return '🍝';
    
    // Bakery/Padaria/Dessert
    if (searchText.includes('padaria') || searchText.includes('bakery') || searchText.includes('bistrô') || searchText.includes('armazém')) return '🥐';
    
    // Fast food/Burger
    if (searchText.includes('lanche') || searchText.includes('burger') || searchText.includes('hambúrguer') || searchText.includes('fast food')) return '🍔';
    
    // Ice cream
    if (searchText.includes('sorvete') || searchText.includes('ice cream')) return '🍦';
    
    // Chinese
    if (searchText.includes('chinês') || searchText.includes('chinese')) return '🥡';
    
    // Barbecue/Churrasco
    if (searchText.includes('churrasco') || searchText.includes('barbecue') || searchText.includes('carne')) return '🥩';
    
    // Mexican
    if (searchText.includes('mexicano') || searchText.includes('mexican')) return '🌮';
    
    // Lebanese/Middle Eastern
    if (searchText.includes('libanês') || searchText.includes('árabe') || searchText.includes('lebanese')) return '🥙';
    
    // Bar/Drinks
    if (searchText.includes('bar')) return '🍺';
    
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
      {/* Warning banner for iOS Simulator with Expo Go */}
      {isExpoGoSimulator && (
        <View className="absolute top-0 left-0 right-0 z-50 bg-yellow-100 border-b border-yellow-200 p-3">
          <View className="flex-row items-center">
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text className="text-yellow-800 text-sm font-medium ml-2 flex-1">
              O mapa pode aparecer vermelho no simulador iOS com Expo Go. Teste no dispositivo físico.
            </Text>
          </View>
        </View>
      )}
      
      <MapView
        ref={mapRef}
        style={{ flex: 1, marginTop: isExpoGoSimulator ? 56 : 0 }}
        provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
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
        // Fallback for iOS simulator issues
        loadingEnabled={true}
        loadingIndicatorColor="#b13bff"
        loadingBackgroundColor="#fafafa"
        onMapReady={() => {
          if (isExpoGoSimulator) {
            console.log('📍 Map ready in iOS Simulator with Expo Go - red tiles are expected');
          }
        }}
      >
        {/* Custom marker for user's current location with nearby places indicator */}
        <Marker
          coordinate={{ latitude, longitude }}
          title="Você está aqui 📍"
          description={`Sua localização atual${getNearbyPlaces().length > 0 ? ` • ${getNearbyPlaces().length} lugar(es) próximo(s)` : ''}`}
          onPress={handleUserLocationPress}
        >
          <View className="relative items-center justify-center">
            {/* Animated pulse ring - outermost */}
            <View className="absolute w-20 h-20 bg-blue-400/15 rounded-full animate-pulse" />
            
            {/* Second pulse ring */}
            <View className="absolute w-16 h-16 bg-blue-400/25 rounded-full animate-pulse" 
                  style={{ animationDelay: '0.5s' }} />
            
            {/* Third pulse ring */}
            <View className="absolute w-12 h-12 bg-blue-500/35 rounded-full animate-pulse" 
                  style={{ animationDelay: '1s' }} />
            
            {/* Main marker container with shadow */}
            <View className="w-5 h-5 bg-white rounded-full items-center justify-center shadow-lg border-3 border-blue-500"
                  style={{
                    shadowColor: '#3b82f6',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 10,
                  }}>
              
              {/* Inner blue dot */}
              <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
                <View className="w-3 h-3 bg-white rounded-full" />
              </View>
            </View>                     
            
            {/* Nearby places indicator */}
            {/* {getNearbyPlaces().length > 0 && (
              <View className="absolute -bottom-6 bg-orange-500 rounded-full px-3 py-1 border-2 border-white shadow-lg">
                <Text className="text-white text-xs font-bold">
                  {getNearbyPlaces().length} 🍽️
                </Text>
              </View>
            )} */}
          </View>
        </Marker>

        {/* Places markers - Filter out nearby places to avoid overlap */}
        {places && places.length > 0 && places
          .filter(place => {
            // Only show places that are NOT within 50 meters of user location
            // const distance = calculateDistance(
            //   latitude, 
            //   longitude, 
            //   place.coordinates.lat, 
            //   place.coordinates.lng
            // );
            // return distance > 0;
            return place;
          })
          .map((place) => {
          
          // Only render markers with valid coordinates
          const lat = place.coordinates.lat;
          const lng = place.coordinates.lng;
          
          if (!lat || !lng || lat === 0 || lng === 0) {
            console.log('Skipping place with invalid coordinates:', place.googleData.name, lat, lng);
            return null;
          }
          
          return (
            <Marker
              key={place.id}
              coordinate={{
                latitude: lat,
                longitude: lng,
              }}
              onPress={() => handlePlacePress(place)}
            >
              <View className="relative">
                {/* Food place marker with emoji */}
                <View className="w-12 h-12 bg-primary-500 rounded-full items-center justify-center shadow-lg">
                  <Text style={{ fontSize: 24 }}>{getFoodEmoji(place)}</Text>
                </View>                
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Search in area button */}
      {showSearchButton && (
        <View className={`absolute left-0 right-0 items-center ${isExpoGoSimulator ? 'top-20' : 'top-6'}`}>
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
                <Text className="text-primary-600 font-semibold ml-2">Buscar na área</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Error message for places */}
      {placesError && (
        <View className={`absolute left-4 right-4 top-24`}>
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
          <Text className="text-white text-xs">Places: {places?.length || 0}</Text>
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