import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    const getLocation = async () => {
      try {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setLocation({
            latitude: null,
            longitude: null,
            error: 'Permissão de localização negada',
            loading: false,
          });
          return;
        }

        // Get current location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          error: null,
          loading: false,
        });
      } catch (error) {
        setLocation({
          latitude: null,
          longitude: null,
          error: 'Erro ao obter localização',
          loading: false,
        });
      }
    };

    getLocation();
  }, []);

  const refreshLocation = async () => {
    setLocation(prev => ({ ...prev, loading: true }));
    
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        error: null,
        loading: false,
      });
    } catch (error) {
      setLocation(prev => ({
        ...prev,
        error: 'Erro ao atualizar localização',
        loading: false,
      }));
    }
  };

  return {
    ...location,
    refreshLocation,
  };
};
