import { firebaseService } from '@/services/firebaseService';
import { Place } from '@/types/places';
import { useCallback, useState } from 'react';

interface UsePlacesReturn {
  places: Place[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  searchPlaces: (latitude: number, longitude: number, zoom?: number) => Promise<void>;
  clearPlaces: () => void;
  clearError: () => void;
}

export const usePlaces = (): UsePlacesReturn => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchPlaces = useCallback(async (
    latitude: number,
    longitude: number,
    zoom = 14
  ) => {
    console.log('🏁 Starting search with params:', { latitude, longitude, zoom });
    setLoading(true);
    setError(null);

    try {
      // Convert zoom level to radius (approximate conversion)
      // Higher zoom = smaller radius, lower zoom = larger radius
      const radius = zoom >= 16 ? 1 : zoom >= 14 ? 3 : zoom >= 12 ? 5 : zoom >= 10 ? 10 : 15;
      
      console.log('📍 Calling Firebase function with radius:', radius);
      const result = await firebaseService.findNearbyPlaces(latitude, longitude, radius);

      if (result.success) {
        console.log('✅ Search results:', result.data);
        console.log('📊 Number of places found:', result.data.length);
        
        setPlaces(result.data);
        setHasSearched(true);
      } else {
        // Even on error, set empty array to prevent undefined
        setPlaces([]);
        throw new Error(result.error || 'Erro ao buscar lugares próximos');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar lugares próximos';
      console.error('❌ Search error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPlaces = useCallback(() => {
    setPlaces([]);
    setHasSearched(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    places,
    loading,
    error,
    hasSearched,
    searchPlaces,
    clearPlaces,
    clearError,
  };
};
