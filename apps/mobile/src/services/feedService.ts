import { functions } from '@/config/firebase';
import {
  DiscoveryFilters,
  FeedFilters,
  FeedItem,
  GetDiscoveryFeedResponse,
  GetFeedResponse
} from '@/types/feed';
import { httpsCallable } from 'firebase/functions';

class FeedService {
  private functions;

  constructor() {
    this.functions = functions;
  }

  /**
   * Buscar feed personalizado do usuário
   */
  async getUserFeed(filters: FeedFilters = {}): Promise<GetFeedResponse> {
    try {
      console.log('🔥 Calling getUserFeed with filters:', filters);
      
      const getUserFeed = httpsCallable(this.functions, 'getUserFeed');
      const result = await getUserFeed({
        limit: filters.limit || 20,
        includeGeographic: filters.includeGeographic ?? true,
        maxDistance: filters.maxDistance || 50,
        types: filters.types,
        friendsOnly: filters.friendsOnly ?? false,
        lastTimestamp: filters.lastTimestamp
      });
      
      console.log('🔥 getUserFeed result:', result);
      
      const responseData = result.data as any;
      
      if (responseData && Array.isArray(responseData.items)) {
        const mappedItems: FeedItem[] = responseData.items.map((item: any) => ({
          id: item.id || item.activityId,
          authorId: item.authorId,
          authorName: item.authorName,
          authorUsername: item.authorUsername,
          authorAvatar: item.authorAvatar,
          type: item.type,
          data: item.data,
          relevanceScore: item.relevanceScore,
          distance: item.distance,
          isFollowing: item.isFollowing,
          createdAt: item.createdAt
        }));

        return {
          items: mappedItems,
          hasMore: responseData.hasMore || false,
          lastTimestamp: responseData.lastTimestamp
        };
      } else {
        console.log('🔥 No feed items found or invalid format');
        return { items: [], hasMore: false };
      }
    } catch (error: any) {
      console.error('🔥 getUserFeed error:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      throw new Error(error.message || 'Erro ao carregar feed');
    }
  }

  /**
   * Buscar feed de descoberta (lugares trending)
   */
  async getDiscoveryFeed(filters: DiscoveryFilters = {}): Promise<GetDiscoveryFeedResponse> {
    try {
      console.log('🔥 Calling getDiscoveryFeed with filters:', filters);
      
      const getDiscoveryFeed = httpsCallable(this.functions, 'getDiscoveryFeed');
      const result = await getDiscoveryFeed({
        limit: filters.limit || 15,
        maxDistance: filters.maxDistance || 25
      });
      
      console.log('🔥 getDiscoveryFeed result:', result);
      
      const responseData = result.data as any;
      
      if (responseData && Array.isArray(responseData.places)) {
        return {
          places: responseData.places,
          region: responseData.region || ''
        };
      } else {
        console.log('🔥 No discovery places found or invalid format');
        return { places: [], region: '' };
      }
    } catch (error: any) {
      console.error('🔥 getDiscoveryFeed error:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      throw new Error(error.message || 'Erro ao carregar descobertas');
    }
  }

  /**
   * Forçar refresh do feed do usuário (limpa cache)
   */
  async refreshUserFeed(): Promise<void> {
    try {
      console.log('🔥 Calling refreshUserFeed');
      
      const refreshUserFeed = httpsCallable(this.functions, 'refreshUserFeed');
      await refreshUserFeed();
      
      console.log('🔥 Feed cache cleared successfully');
    } catch (error: any) {
      console.error('🔥 refreshUserFeed error:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      // Não lança erro para refresh, apenas loga
      console.warn('Feed refresh failed, continuing with cached data');
    }
  }

  /**
   * Marcar atividade como vista (para analytics)
   */
  async markActivityAsViewed(activityId: string): Promise<void> {
    try {
      const markActivityAsViewed = httpsCallable(this.functions, 'markActivityAsViewed');
      await markActivityAsViewed({ activityId });
    } catch (error: any) {
      console.error('🔥 markActivityAsViewed error:', error);
      // Não bloqueia o fluxo principal
    }
  }

  /**
   * Curtir uma atividade
   */
  async likeActivity(activityId: string): Promise<void> {
    try {
      const likeActivity = httpsCallable(this.functions, 'likeActivity');
      await likeActivity({ activityId });
    } catch (error: any) {
      console.error('🔥 likeActivity error:', error);
      throw new Error(error.message || 'Erro ao curtir atividade');
    }
  }

  /**
   * Descurtir uma atividade
   */
  async unlikeActivity(activityId: string): Promise<void> {
    try {
      const unlikeActivity = httpsCallable(this.functions, 'unlikeActivity');
      await unlikeActivity({ activityId });
    } catch (error: any) {
      console.error('🔥 unlikeActivity error:', error);
      throw new Error(error.message || 'Erro ao descurtir atividade');
    }
  }
}

export const feedService = new FeedService();
