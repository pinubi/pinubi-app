# Implementação Client-Side - Sistema de Feed

## 📱 React Native / Expo Implementation

### 1. Hook customizado para Feed

```typescript
// hooks/useFeed.ts
import { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export interface FeedItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  type: 'place_added' | 'place_visited' | 'place_reviewed' | 'list_created';
  data: any;
  relevanceScore: number;
  distance?: number;
  isFollowing: boolean;
  createdAt: any;
}

interface UseFeedReturn {
  items: FeedItem[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export const useFeed = (options: {
  limit?: number;
  types?: string[];
  friendsOnly?: boolean;
  maxDistance?: number;
} = {}): UseFeedReturn => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastTimestamp, setLastTimestamp] = useState<any>(null);

  const getUserFeed = httpsCallable(functions, 'getUserFeed');

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (loading && !isRefresh) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
        setError(null);
      } else {
        setLoading(true);
      }

      const response = await getUserFeed({
        limit: options.limit || 20,
        lastTimestamp: isRefresh ? null : lastTimestamp,
        types: options.types,
        friendsOnly: options.friendsOnly,
        maxDistance: options.maxDistance || 50,
        includeGeographic: true
      });

      const feedData = response.data;

      if (isRefresh) {
        setItems(feedData.items);
        setLastTimestamp(null);
      } else {
        setItems(prev => [...prev, ...feedData.items]);
      }

      setHasMore(feedData.hasMore);
      
      if (feedData.items.length > 0) {
        setLastTimestamp(feedData.items[feedData.items.length - 1].createdAt);
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar feed');
      console.error('Erro no feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lastTimestamp, options]);

  const refresh = useCallback(() => loadFeed(true), [loadFeed]);
  const loadMore = useCallback(() => loadFeed(false), [loadFeed]);

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
    loadMore
  };
};
```

### 2. Hook para Feed de Descoberta

```typescript
// hooks/useDiscoveryFeed.ts
import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export interface TrendingPlace {
  placeId: string;
  placeName: string;
  placeAddress: string;
  coordinates: { lat: number; lng: number };
  activityCount: number;
  distance: number;
  avgRating?: number;
  categories: string[];
  photos?: string[];
}

export const useDiscoveryFeed = () => {
  const [places, setPlaces] = useState<TrendingPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<string>('');

  const getDiscoveryFeed = httpsCallable(functions, 'getDiscoveryFeed');

  const loadDiscovery = useCallback(async (maxDistance = 25) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getDiscoveryFeed({
        limit: 15,
        maxDistance
      });

      const data = response.data;
      setPlaces(data.trendingPlaces);
      setRegion(data.region);

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar descobertas');
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
```

### 3. Componente de Feed Principal

```typescript
// components/FeedScreen.tsx
import React from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Text,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useFeed } from '../hooks/useFeed';
import { FeedItemComponent } from './FeedItemComponent';
import { EmptyFeedComponent } from './EmptyFeedComponent';
import { ErrorComponent } from './ErrorComponent';

export const FeedScreen: React.FC = () => {
  const { items, loading, refreshing, hasMore, error, refresh, loadMore } = useFeed({
    limit: 20,
    maxDistance: 50
  });

  const renderFeedItem = ({ item }: { item: any }) => (
    <FeedItemComponent item={item} />
  );

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.footerText}>Carregando mais...</Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (hasMore && !loading && !refreshing) {
      loadMore();
    }
  };

  if (error && items.length === 0) {
    return <ErrorComponent error={error} onRetry={refresh} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          loading ? null : <EmptyFeedComponent onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          items.length === 0 ? styles.emptyContainer : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  emptyContainer: {
    flex: 1
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  footerText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14
  }
});
```

### 4. Componente de Item do Feed

```typescript
// components/FeedItemComponent.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { FeedItem } from '../hooks/useFeed';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  item: FeedItem;
}

export const FeedItemComponent: React.FC<Props> = ({ item }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'place_reviewed': return '⭐';
      case 'place_visited': return '📍';
      case 'place_added': return '➕';
      case 'list_created': return '📝';
      default: return '📱';
    }
  };

  const getActivityText = (type: string, data: any) => {
    switch (type) {
      case 'place_reviewed':
        return `avaliou ${data.placeName} com nota ${data.rating}`;
      case 'place_visited':
        return `visitou ${data.placeName}`;
      case 'place_added':
        return `adicionou ${data.placeName} à lista "${data.listName}"`;
      case 'list_created':
        return `criou a lista "${data.listName}"`;
      default:
        return 'fez uma atividade';
    }
  };

  const timeAgo = formatDistanceToNow(
    new Date(item.createdAt.seconds * 1000),
    { addSuffix: true, locale: ptBR }
  );

  return (
    <TouchableOpacity style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: item.authorAvatar || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View style={styles.textInfo}>
            <Text style={styles.authorName}>{item.authorName}</Text>
            <Text style={styles.activityText}>
              {getActivityIcon(item.type)} {getActivityText(item.type, item.data)}
            </Text>
          </View>
        </View>
        <View style={styles.metadata}>
          <Text style={styles.timeText}>{timeAgo}</Text>
          {item.distance && (
            <Text style={styles.distanceText}>
              {item.distance.toFixed(1)}km
            </Text>
          )}
        </View>
      </View>

      {/* Content específico por tipo */}
      {item.type === 'place_reviewed' && item.data.comment && (
        <Text style={styles.comment}>"{item.data.comment}"</Text>
      )}

      {item.data.photos && item.data.photos.length > 0 && (
        <Image
          source={{ uri: item.data.photos[0] }}
          style={styles.photo}
          resizeMode="cover"
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.relevanceScore}>
          Score: {item.relevanceScore.toFixed(1)}
        </Text>
        {item.isFollowing && (
          <View style={styles.followingBadge}>
            <Text style={styles.followingText}>Seguindo</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12
  },
  textInfo: {
    flex: 1
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  metadata: {
    alignItems: 'flex-end'
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2
  },
  distanceText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500'
  },
  comment: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  relevanceScore: {
    fontSize: 12,
    color: '#999'
  },
  followingBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  followingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500'
  }
});
```

### 5. Screen de Descoberta

```typescript
// components/DiscoveryScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useDiscoveryFeed } from '../hooks/useDiscoveryFeed';

export const DiscoveryScreen: React.FC = () => {
  const { places, loading, error, region, loadDiscovery } = useDiscoveryFeed();

  useEffect(() => {
    loadDiscovery();
  }, []);

  const renderTrendingPlace = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.placeCard}>
      <Text style={styles.placeName}>{item.placeName}</Text>
      <Text style={styles.placeAddress}>{item.placeAddress}</Text>
      <View style={styles.placeStats}>
        <Text style={styles.activityCount}>
          🔥 {item.activityCount} atividade{item.activityCount > 1 ? 's' : ''}
        </Text>
        <Text style={styles.distance}>
          📍 {item.distance.toFixed(1)}km
        </Text>
      </View>
      {item.avgRating && (
        <Text style={styles.rating}>
          ⭐ {item.avgRating.toFixed(1)}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Descobrindo lugares trending...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Trending em {region}</Text>
      <Text style={styles.subtitle}>
        Lugares com mais atividade nos últimos 7 dias
      </Text>

      <FlatList
        data={places}
        renderItem={renderTrendingPlace}
        keyExtractor={(item) => item.placeId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24
  },
  listContainer: {
    paddingBottom: 20
  },
  placeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  placeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  placeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  activityCount: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500'
  },
  distance: {
    fontSize: 14,
    color: '#007AFF'
  },
  rating: {
    fontSize: 14,
    color: '#FF9500',
    marginTop: 8
  }
});
```

## 🔄 Estratégia de Cache Local

```typescript
// utils/feedCache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'feed_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

interface CacheData {
  items: any[];
  timestamp: number;
  hasMore: boolean;
}

export const feedCache = {
  async save(items: any[], hasMore: boolean): Promise<void> {
    const cacheData: CacheData = {
      items,
      timestamp: Date.now(),
      hasMore
    };
    
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  },

  async load(): Promise<CacheData | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheData: CacheData = JSON.parse(cached);
      
      // Verificar se cache não expirou
      if (Date.now() - cacheData.timestamp > CACHE_EXPIRY) {
        await this.clear();
        return null;
      }

      return cacheData;
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(CACHE_KEY);
  }
};
```

## 📊 Analytics e Métricas

```typescript
// utils/feedAnalytics.ts
import analytics from '@react-native-firebase/analytics';

export const trackFeedEvents = {
  feedViewed: (itemCount: number) => {
    analytics().logEvent('feed_viewed', {
      item_count: itemCount,
      timestamp: Date.now()
    });
  },

  feedItemClicked: (item: any) => {
    analytics().logEvent('feed_item_clicked', {
      item_type: item.type,
      author_id: item.authorId,
      relevance_score: item.relevanceScore,
      is_following: item.isFollowing
    });
  },

  feedRefreshed: () => {
    analytics().logEvent('feed_refreshed', {
      timestamp: Date.now()
    });
  },

  discoveryViewed: (placeCount: number, region: string) => {
    analytics().logEvent('discovery_viewed', {
      place_count: placeCount,
      region: region
    });
  }
};
```

Este sistema de feed completo oferece:

- ✅ **Feed personalizado** com algoritmo de relevância
- ✅ **Feed de descoberta** com lugares trending
- ✅ **Cache inteligente** para performance
- ✅ **Infinite scroll** com paginação
- ✅ **Pull-to-refresh** para atualizações
- ✅ **Analytics** para métricas de engajamento
- ✅ **Error handling** robusto
- ✅ **Loading states** bem definidos
