import { feedService } from '@/services/feedService';
import { FeedFilters, FeedItem } from '@/types/feed';
import { trackFeedEvents } from '@/utils/feedAnalytics';
import { feedCache } from '@/utils/feedCache';
import { useCallback, useEffect, useState } from 'react';

interface UseFeedReturn {
  items: FeedItem[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  likeItem: (itemId: string) => Promise<void>;
  markAsViewed: (itemId: string) => void;
}

export const useFeed = (options: FeedFilters = {}): UseFeedReturn => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastTimestamp, setLastTimestamp] = useState<string | undefined>(undefined);

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (loading && !isRefresh) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
        setError(null);
        
        // Tentar carregar do cache primeiro
        if (!isRefresh) {
          const cachedData = await feedCache.load();
          if (cachedData && cachedData.items.length > 0) {
            setItems(cachedData.items);
            setHasMore(cachedData.hasMore);
            trackFeedEvents.feedViewed(cachedData.items.length);
            return;
          }
        }
        
        // Limpar cache no servidor se for refresh
        await feedService.refreshUserFeed();
        trackFeedEvents.feedRefreshed();
      } else {
        setLoading(true);
      }

      const filters: FeedFilters = {
        ...options,
        lastTimestamp: isRefresh ? undefined : lastTimestamp,
      };

      const response = await feedService.getUserFeed(filters);

      if (isRefresh) {
        setItems(response.items);
        setLastTimestamp(response.lastTimestamp);
        
        // Salvar no cache apenas no refresh
        await feedCache.save(response.items, response.hasMore);
      } else {
        setItems(prev => [...prev, ...response.items]);
        if (response.lastTimestamp) {
          setLastTimestamp(response.lastTimestamp);
        }
      }

      setHasMore(response.hasMore);
      setError(null);
      
      // Analytics
      trackFeedEvents.feedViewed(response.items.length);

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar feed';
      setError(errorMessage);
      trackFeedEvents.feedError(errorMessage, isRefresh ? 'refresh' : 'load_more');
      console.error('Erro no feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lastTimestamp, options, loading]);

  const refresh = useCallback(() => loadFeed(true), [loadFeed]);
  
  const loadMore = useCallback(async () => {
    if (hasMore && !loading && !refreshing) {
      await loadFeed(false);
    }
  }, [hasMore, loading, refreshing, loadFeed]);

  const likeItem = useCallback(async (itemId: string) => {
    try {
      // Encontrar o item para analytics
      const item = items.find(i => i.id === itemId);
      
      // Atualizar UI otimisticamente
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            // Aqui assumimos que temos um campo de interações
            // que será implementado conforme a estrutura real dos dados
          };
        }
        return item;
      }));

      await feedService.likeActivity(itemId);
      
      // Analytics
      if (item) {
        trackFeedEvents.feedItemLiked(itemId, item.type);
      }
    } catch (error: any) {
      console.error('Erro ao curtir item:', error);
      // Reverter mudança otimista em caso de erro
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            // Reverter mudanças
          };
        }
        return item;
      }));
    }
  }, [items]);

  const markAsViewed = useCallback((itemId: string) => {
    // Marcar como visto de forma assíncrona para analytics
    feedService.markActivityAsViewed(itemId);
    
    // Analytics local
    const item = items.find(i => i.id === itemId);
    if (item) {
      trackFeedEvents.feedItemClicked(item);
    }
  }, [items]);

  useEffect(() => {
    loadFeed(true);
  }, []);

  return {
    items,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
    likeItem,
    markAsViewed
  };
};
