import { feedService } from '@/services/feedService';
import { trackFeedEvents } from '@/utils/feedAnalytics';
import { DiscoveryFilters, TrendingPlace } from '@pinubi/types';
import { useCallback, useState } from 'react';

interface UseDiscoveryFeedReturn {
  places: TrendingPlace[];
  loading: boolean;
  error: string | null;
  region: string;
  loadDiscovery: (maxDistance?: number) => Promise<void>;
}

export const useDiscoveryFeed = (): UseDiscoveryFeedReturn => {
  const [places, setPlaces] = useState<TrendingPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<string>('');

  const loadDiscovery = useCallback(async (maxDistance = 25) => {
    setLoading(true);
    setError(null);

    try {
      const filters: DiscoveryFilters = {
        limit: 15,
        maxDistance
      };

      const response = await feedService.getDiscoveryFeed(filters);

      setPlaces(response.places);
      setRegion(response.region);
      setError(null);

      // Analytics
      trackFeedEvents.discoveryViewed(response.places.length, response.region);

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar descobertas';
      setError(errorMessage);
      trackFeedEvents.feedError(errorMessage, 'discovery');
      console.error('Erro no discovery feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    places,
    loading,
    error,
    region,
    loadDiscovery
  };
};
