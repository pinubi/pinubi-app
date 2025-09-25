import { functions } from '@/config/firebase';
import type { PublicUser, UserSearchFilters } from '@pinubi/types';
import { httpsCallable } from 'firebase/functions';

// Response interfaces for all Firebase Functions
interface SearchUsersResponse {
  success: boolean;
  users: PublicUser[];
  totalCount: number;
  hasMore: boolean;
  lastDoc?: any;
  error?: string;
}

interface GetFollowersResponse {
  success: boolean;
  followers: PublicUser[];
  hasMore: boolean;
  lastDoc?: any;
  error?: string;
}

interface GetFollowingResponse {
  success: boolean;
  following: PublicUser[];
  hasMore: boolean;
  lastDoc?: any;
  error?: string;
}

interface FollowUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface UnfollowUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface CheckFollowStatusResponse {
  success: boolean;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
  followedAt?: any;
  error?: string;
}

interface GetFollowStatsResponse {
  success: boolean;
  followersCount: number;
  followingCount: number;
  error?: string;
}

interface FindNearbyUsersResponse {
  success: boolean;
  users: PublicUser[];
  userLocation?: string;
  radius?: number;
  error?: string;
}

interface GetUserSuggestionsResponse {
  success: boolean;
  suggestions: Array<PublicUser & {
    relevanceScore: number;
    commonCategories?: string[];
    mutualFollows: number;
  }>;
  error?: string;
}

interface ExploreUsersByCategoryResponse {
  success: boolean;
  users: Array<PublicUser & {
    relevanceScore: number;
    featuredPlaces: Array<{
      name: string;
      category: string;
      rating: number;
      reviewCount: number;
      followersCount: number;
    }>;
  }>;
  totalFound?: number;
  error?: string;
}

// Filter and parameter interfaces
interface FindNearbyUsersParams {
  radius?: number;
  limit?: number;
}

interface GetUserSuggestionsParams {
  limit?: number;
}

interface ExploreUsersByCategoryParams {
  category: string;
  limit?: number;
  orderBy?: 'activity' | 'followers' | 'recent';
}

class UserService {
  private functions;

  constructor() {
    this.functions = functions;
  }

  async initializeNewUser(): Promise<boolean> {
    try {
      const initiateUser = httpsCallable(this.functions, 'initializeNewUser');
      await initiateUser();

      return true;      
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Search for users by various filters
   */
  async searchUsers(filters: UserSearchFilters): Promise<SearchUsersResponse> {
    try {
      const searchUsers = httpsCallable(this.functions, 'searchUsers');
      const response = await searchUsers(filters);
      const responseData = response.data as SearchUsersResponse;

      if (responseData.success) {
        return responseData;
      } else {
        const errorMsg = responseData.error || 'Erro desconhecido na busca';
        return {
          success: false,
          users: [],
          totalCount: 0,
          hasMore: false,
          error: errorMsg
        };
      }
    } catch (error: any) {
      
      // Enhanced error handling with specific error codes
      let errorMessage = 'Erro ao buscar usuários';
      
      if (error?.code === 'functions/not-found') {
        errorMessage = 'Função não encontrada. Verifique se as Cloud Functions estão implantadas.';
      } else if (error?.code === 'functions/permission-denied') {
        errorMessage = 'Acesso negado. Faça login novamente.';
      } else if (error?.code === 'functions/unauthenticated') {
        errorMessage = 'Usuário não autenticado. Faça login novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        users: [],
        totalCount: 0,
        hasMore: false,
        error: errorMessage
      };
    }
  }

  /**
   * Follow a user
   */
  async followUser(userToFollowId: string): Promise<FollowUserResponse> {
    try {
      const followUser = httpsCallable(this.functions, 'followUser');
      const response = await followUser({ userToFollowId });
      const responseData = response.data as FollowUserResponse;

      if (responseData.success) {
        return responseData;
      } else {
        const errorMsg = responseData.error || 'Erro desconhecido ao seguir usuário';
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error: any) {
      
      let errorMessage = 'Erro ao seguir usuário';
      
      if (error?.code === 'functions/not-found') {
        errorMessage = 'Função não encontrada. Verifique se as Cloud Functions estão implantadas.';
      } else if (error?.code === 'functions/permission-denied') {
        errorMessage = 'Acesso negado. Faça login novamente.';
      } else if (error?.code === 'functions/unauthenticated') {
        errorMessage = 'Usuário não autenticado. Faça login novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userToUnfollowId: string): Promise<UnfollowUserResponse> {
    try {
      const unfollowUser = httpsCallable(this.functions, 'unfollowUser');
      const response = await unfollowUser({ userToUnfollowId });
      const responseData = response.data as UnfollowUserResponse;

      if (responseData.success) {
        return responseData;
      } else {
        const errorMsg = responseData.error || 'Erro desconhecido ao deixar de seguir usuário';
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error: any) {
      
      let errorMessage = 'Erro ao deixar de seguir usuário';
      
      if (error?.code === 'functions/not-found') {
        errorMessage = 'Função não encontrada. Verifique se as Cloud Functions estão implantadas.';
      } else if (error?.code === 'functions/permission-denied') {
        errorMessage = 'Acesso negado. Faça login novamente.';
      } else if (error?.code === 'functions/unauthenticated') {
        errorMessage = 'Usuário não autenticado. Faça login novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Check follow status between current user and target user
   */
  async checkFollowStatus(targetUserId: string): Promise<CheckFollowStatusResponse> {
    try {
      const checkFollowStatus = httpsCallable(this.functions, 'checkFollowStatus');
      const response = await checkFollowStatus({ targetUserId });
      const responseData = response.data as CheckFollowStatusResponse;

      if (responseData.success) {
        return responseData;
      } else {
        const errorMsg = responseData.error || 'Erro desconhecido ao verificar status de seguimento';
        return {
          success: false,
          isFollowing: false,
          isFollowedBy: false,
          isMutual: false,
          error: errorMsg
        };
      }
    } catch (error: any) {
      
      let errorMessage = 'Erro ao verificar status de seguimento';
      
      if (error?.code === 'functions/not-found') {
        errorMessage = 'Função não encontrada. Verifique se as Cloud Functions estão implantadas.';
      } else if (error?.code === 'functions/permission-denied') {
        errorMessage = 'Acesso negado. Faça login novamente.';
      } else if (error?.code === 'functions/unauthenticated') {
        errorMessage = 'Usuário não autenticado. Faça login novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        isFollowing: false,
        isFollowedBy: false,
        isMutual: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get follow statistics (followers/following count)
   */
  async getFollowStats(userId?: string): Promise<GetFollowStatsResponse> {
    try {
      const getFollowStats = httpsCallable(this.functions, 'getFollowStats');
      const response = await getFollowStats({ userId: userId || undefined });
      
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from getFollowStats function');
      }

      let responseData: GetFollowStatsResponse;
      const data = response.data as any;

      // Handle different possible response formats
      if (typeof data.success === 'boolean') {
        // Standard wrapped format
        responseData = data as GetFollowStatsResponse;
      } else if (typeof data.followersCount === 'number' && typeof data.followingCount === 'number') {
        // Direct format (no success field)
        responseData = {
          success: true,
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0
        };
      } else {
        throw new Error('Invalid response format from getFollowStats function');
      }

      if (responseData.success) {
        return responseData;
      } else {
        const errorMsg = responseData.error || 'Erro desconhecido ao buscar estatísticas';
        return {
          success: false,
          followersCount: 0,
          followingCount: 0,
          error: errorMsg
        };
      }
    } catch (error: any) {
      
      let errorMessage = 'Erro ao buscar estatísticas de seguimento';
      
      if (error?.code === 'functions/not-found') {
        errorMessage = 'Função getFollowStats não encontrada. Verifique se as Cloud Functions estão implantadas.';
      } else if (error?.code === 'functions/permission-denied') {
        errorMessage = 'Acesso negado. Faça login novamente.';
      } else if (error?.code === 'functions/unauthenticated') {
        errorMessage = 'Usuário não autenticado. Faça login novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        followersCount: 0,
        followingCount: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Find users nearby geographically
   */
  async findNearbyUsers(params: FindNearbyUsersParams = {}): Promise<FindNearbyUsersResponse> {
    try {
      const findNearbyUsers = httpsCallable(this.functions, 'findNearbyUsers');
      const response = await findNearbyUsers(params);
      const responseData = response.data as FindNearbyUsersResponse;

      if (responseData.success) {
        return responseData;
      } else {
        const errorMsg = responseData.error || 'Erro desconhecido ao buscar usuários próximos';
        return {
          success: false,
          users: [],
          error: errorMsg
        };
      }
    } catch (error: any) {
      
      let errorMessage = 'Erro ao buscar usuários próximos';
      
      if (error?.code === 'functions/not-found') {
        errorMessage = 'Função não encontrada. Verifique se as Cloud Functions estão implantadas.';
      } else if (error?.code === 'functions/permission-denied') {
        errorMessage = 'Acesso negado. Faça login novamente.';
      } else if (error?.code === 'functions/unauthenticated') {
        errorMessage = 'Usuário não autenticado. Faça login novamente.';
      } else if (error?.code === 'functions/unavailable') {
        errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        users: [],
        error: errorMessage
      };
    }
  }

  /**
   * Get intelligent user suggestions
   */
  async getUserSuggestions(params: GetUserSuggestionsParams = {}): Promise<GetUserSuggestionsResponse> {
    try {
      const getUserSuggestions = httpsCallable(this.functions, 'getUserSuggestions');
      const response = await getUserSuggestions(params);
      const responseData = response.data as GetUserSuggestionsResponse;

      if (responseData.success) {
        return responseData;
      } else {
        const errorMsg = responseData.error || 'Erro desconhecido ao buscar sugestões';
        return {
          success: false,
          suggestions: [],
          error: errorMsg
        };
      }
    } catch (error: any) {
      
      let errorMessage = 'Erro ao buscar sugestões de usuários';
      
      if (error?.code === 'functions/not-found') {
        errorMessage = 'Função não encontrada. Verifique se as Cloud Functions estão implantadas.';
      } else if (error?.code === 'functions/permission-denied') {
        errorMessage = 'Acesso negado. Faça login novamente.';
      } else if (error?.code === 'functions/unauthenticated') {
        errorMessage = 'Usuário não autenticado. Faça login novamente.';
      } else if (error?.code === 'functions/deadline-exceeded') {
        errorMessage = 'Tempo limite excedido. Tente novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        suggestions: [],
        error: errorMessage
      };
    }
  }

  /**
   * Explore users by category/interest
   */
  async exploreUsersByCategory(params: ExploreUsersByCategoryParams): Promise<ExploreUsersByCategoryResponse> {
    try {
      const exploreUsersByCategory = httpsCallable(this.functions, 'exploreUsersByCategory');
      const response = await exploreUsersByCategory(params);
      const responseData = response.data as ExploreUsersByCategoryResponse;

      if (responseData.success) {
        return responseData;
      } else {
        const errorMsg = responseData.error || 'Erro desconhecido ao explorar usuários';
        return {
          success: false,
          users: [],
          error: errorMsg
        };
      }
    } catch (error: any) {
      
      let errorMessage = 'Erro ao explorar usuários por categoria';
      
      if (error?.code === 'functions/not-found') {
        errorMessage = 'Função não encontrada. Verifique se as Cloud Functions estão implantadas.';
      } else if (error?.code === 'functions/permission-denied') {
        errorMessage = 'Acesso negado. Faça login novamente.';
      } else if (error?.code === 'functions/unauthenticated') {
        errorMessage = 'Usuário não autenticado. Faça login novamente.';
      } else if (error?.code === 'functions/invalid-argument') {
        errorMessage = 'Categoria inválida. Tente uma categoria diferente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        users: [],
        error: errorMessage
      };
    }
  }

  /**
   * Get followers of the current user
   */
  async getFollowers(limit = 20, startAfter: any = null): Promise<GetFollowersResponse> {
    try {
      const getFollowers = httpsCallable(this.functions, 'getFollowers');
      const params = {
        limit,
        startAfter: startAfter || undefined
      };

      const response = await getFollowers(params);
      
      // Check if response.data exists and has the expected structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from getFollowers function');
      }

      let responseData: GetFollowersResponse;
      
      // Handle different possible response formats
      if (Array.isArray(response.data)) {
        // If Firebase returns array directly (simple format)
        responseData = {
          success: true,
          followers: response.data as PublicUser[],
          hasMore: false
        };
      } else if (response.data && typeof response.data === 'object') {
        const data = response.data as any;
        
        // Check if it's the direct Firebase format (no success field)
        if ('followers' in data && typeof data.followers !== 'undefined') {
          responseData = {
            success: true,
            followers: data.followers as PublicUser[],
            hasMore: data.hasMore || false,
            lastDoc: data.lastDoc
          };
        } else if (typeof data.success === 'boolean') {
          // Standard wrapped format
          responseData = data as GetFollowersResponse;
        } else {
          // Try to handle case where data might be the users array
          if (Array.isArray(data)) {
            responseData = {
              success: true,
              followers: data as PublicUser[],
              hasMore: false
            };
          } else {
            throw new Error('Invalid response format from getFollowers function');
          }
        }
      } else {
        throw new Error('Invalid response format from getFollowers function');
      }

      if (responseData.success) {
        
        // Ensure followers array exists and has valid structure
        if (!Array.isArray(responseData.followers)) {
          responseData.followers = [];
        }
        
        return responseData;
      } else {
        const errorMsg = responseData.error || 'Erro desconhecido ao buscar seguidores';
        return {
          success: false,
          followers: [],
          hasMore: false,
          error: errorMsg
        };
      }
    } catch (error: any) {
      
      let userFriendlyMessage = 'Erro ao buscar seguidores';
      
      if (error.code === 'not-found') {
        userFriendlyMessage = 'Função getFollowers não encontrada. Verifique se as Cloud Functions estão implantadas.';
      } else if (error.code === 'unauthenticated') {
        userFriendlyMessage = 'Usuário não autenticado. Faça login novamente.';
      } else if (error.code === 'permission-denied') {
        userFriendlyMessage = 'Permissão negada para acessar seguidores.';
      }
      
      return {
        success: false,
        followers: [],
        hasMore: false,
        error: userFriendlyMessage,
      };
    }
  }

  /**
   * Get users that the current user is following
   */
  async getFollowing(limit = 20, startAfter: any = null): Promise<GetFollowingResponse> {
    try {
      const getFollowing = httpsCallable(this.functions, 'getFollowing');
      const params = {
        limit,
        startAfter: startAfter || undefined
      };

      const response = await getFollowing(params);
      
      // Check if response.data exists and has the expected structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from getFollowing function');
      }

      let responseData: GetFollowingResponse;
      
      // Handle different possible response formats
      if (Array.isArray(response.data)) {
        // If Firebase returns array directly (simple format)
        responseData = {
          success: true,
          following: response.data as PublicUser[],
          hasMore: false
        };
      } else if (response.data && typeof response.data === 'object') {
        const data = response.data as any;
        
        // Check if it's the direct Firebase format (no success field)
        if ('following' in data && typeof data.following !== 'undefined') {
          responseData = {
            success: true,
            following: data.following as PublicUser[],
            hasMore: data.hasMore || false,
            lastDoc: data.lastDoc
          };
        } else if (typeof data.success === 'boolean') {
          // Standard wrapped format
          responseData = data as GetFollowingResponse;
        } else {
          // Try to handle case where data might be the users array
          if (Array.isArray(data)) {
            responseData = {
              success: true,
              following: data as PublicUser[],
              hasMore: false
            };
          } else {
            throw new Error('Invalid response format from getFollowing function');
          }
        }
      } else {
        throw new Error('Invalid response format from getFollowing function');
      }

      if (responseData.success) {
        
        // Ensure following array exists and has valid structure
        if (!Array.isArray(responseData.following)) {
          responseData.following = [];
        }
        
        return responseData;
      } else {
        const errorMsg = responseData.error || 'Erro desconhecido ao buscar usuários seguidos';
        return {
          success: false,
          following: [],
          hasMore: false,
          error: errorMsg
        };
      }
    } catch (error: any) {
      
      let userFriendlyMessage = 'Erro ao buscar usuários seguidos';
      
      if (error.code === 'not-found') {
        userFriendlyMessage = 'Função getFollowing não encontrada. Verifique se as Cloud Functions estão implantadas.';
      } else if (error.code === 'unauthenticated') {
        userFriendlyMessage = 'Usuário não autenticado. Faça login novamente.';
      } else if (error.code === 'permission-denied') {
        userFriendlyMessage = 'Permissão negada para acessar usuários seguidos.';
      }
      
      return {
        success: false,
        following: [],
        hasMore: false,
        error: userFriendlyMessage,
      };
    }
  }

}

export const userService = new UserService();

/**
 * 🚀 PINUBI USER SERVICE - PURE FIREBASE FUNCTIONS INTEGRATION
 * 
 * ✅ IMPLEMENTED FUNCTIONS:
 * 
 * 📋 RELATIONSHIP FUNCTIONS:
 * - followUser(userToFollowId) - Follow a user (handles public/private accounts)
 * - unfollowUser(userToUnfollowId) - Unfollow a user
 * - checkFollowStatus(targetUserId) - Check follow status between users
 * - getFollowStats(userId?) - Get followers/following counts
 * 
 * 📋 LISTING FUNCTIONS:
 * - getFollowers(limit, startAfter) - List user's followers with pagination
 * - getFollowing(limit, startAfter) - List users being followed with pagination
 * 
 * 📋 DISCOVERY FUNCTIONS:
 * - searchUsers(filters) - Search users by name, username, location
 * - findNearbyUsers(radius, limit) - Find users nearby geographically
 * - getUserSuggestions(limit) - Get intelligent user suggestions
 * - exploreUsersByCategory(category, orderBy) - Explore users by interests
 * 
 * 🔧 FEATURES:
 * - Pure Firebase Cloud Functions integration
 * - Enhanced error handling with specific error codes
 * - Detailed logging and debugging information
 * - Rate limiting awareness
 * - Proper TypeScript interfaces
 * - Brazilian Portuguese UI messages
 * - Pagination support where applicable
 * - No mock data - real Firebase integration only
 * 
 * 📚 USAGE EXAMPLES:
 * 
 * // Follow a user
 * const result = await userService.followUser('user123');
 * 
 * // Search users
 * const users = await userService.searchUsers({ query: 'João Silva' });
 * 
 * // Get followers
 * const followers = await userService.getFollowers(20);
 * 
 * // Find nearby users
 * const nearby = await userService.findNearbyUsers({ radius: 50 });
 * 
 * // Get suggestions
 * const suggestions = await userService.getUserSuggestions({ limit: 15 });
 * 
 * 🔗 This service integrates with Firebase Cloud Functions as documented in:
 * /docs/follow-system.md
 * 
 * ⚠️ IMPORTANT: This service requires the Firebase Cloud Functions to be deployed
 * and properly configured. All functions will return errors if the backend is not available.
 * 
 * 🐛 TROUBLESHOOTING "not-found" ERROR:
 * 1. Verify functions are deployed: firebase functions:list
 * 2. Check Firebase project configuration
 * 3. Ensure function names match exactly (case-sensitive)
 * 4. Check Firebase Console for deployment status
 * 
 * 📝 NOTE: Follow request operations are handled by followRequestService.ts
 */
