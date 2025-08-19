import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { useLocation } from '@/hooks/useLocation';

interface PinubiMapViewProps {
  onLocationRefresh?: () => void;
}

const PinubiMapView: React.FC<PinubiMapViewProps> = ({ onLocationRefresh }) => {
  const { latitude, longitude, error, loading, refreshLocation } = useLocation();

  const handleRefreshLocation = () => {
    refreshLocation();
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
        style={{ flex: 1 }}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        region={{
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
        showsPointsOfInterest={true}
        showsTraffic={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
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
      </MapView>

      {/* Refresh location button */}
      <TouchableOpacity
        onPress={handleRefreshLocation}
        className="absolute bottom-6 right-6 w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg border border-primary-100"
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