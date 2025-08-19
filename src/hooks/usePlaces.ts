import { serperService } from '@/services/serperService';
import { SerperPlace } from '@/types/places';
import { useCallback, useState } from 'react';

interface UsePlacesReturn {
  places: SerperPlace[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  searchPlaces: (latitude: number, longitude: number, query?: string, zoom?: number) => Promise<void>;
  clearPlaces: () => void;
  clearError: () => void;
}

export const usePlaces = (): UsePlacesReturn => {
  const [places, setPlaces] = useState<SerperPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchPlaces = useCallback(async (
    latitude: number,
    longitude: number,
    query = 'restaurantes comida cafés lanchonetes',
    zoom = 14
  ) => {
    console.log('🏁 Starting search with params:', { latitude, longitude, query, zoom });
    setLoading(true);
    setError(null);

    try {
      const results = await serperService.searchNearbyPlaces({
        query,
        latitude,
        longitude,
        zoom,
        language: 'pt-br',
      });

      console.log('✅ Search results:', results);
      console.log('📊 Number of places found:', results.length);
      
      setPlaces(results);
      setHasSearched(true);
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
