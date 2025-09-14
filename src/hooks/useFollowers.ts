import { followRequestService } from '@/services/followRequestService';
import { userService } from '@/services/userService';
import type { FollowRequest, PublicUser, UserActionType } from '@/types/users';
import { useState } from 'react';

interface UseFollowersResult {
  followers: PublicUser[];
  following: PublicUser[];
  followRequests: FollowRequest[];
  searchResults: PublicUser[];
  loading: boolean;
  searchLoading: boolean;
  error: string | null;
  searchError: string | null;
  stats: {
    followersCount: number;
    followingCount: number;
    pendingRequestsCount: number;
  };
  actions: {
    loadFollowers: () => Promise<void>;
    loadFollowing: () => Promise<void>;
    loadFollowRequests: () => Promise<void>;
    loadFollowStats: () => Promise<void>;
    handleUserAction: (userId: string, action: UserActionType) => Promise<void>;
    searchUsers: (query: string) => Promise<void>;
    clearSearchResults: () => void;
    refresh: () => Promise<void>;
  };
}

export const useFollowers = (userId?: string): UseFollowersResult => {
  const [followers, setFollowers] = useState<PublicUser[]>([]);
  const [following, setFollowing] = useState<PublicUser[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [actualStats, setActualStats] = useState({
    followersCount: 0,
    followingCount: 0,
    pendingRequestsCount: 0,
  });

  const loadFollowStats = async () => {
    try {
      console.log('📊 Loading follow stats...');
      const response = await userService.getFollowStats(userId);
      
      if (response.success) {
        console.log('✅ Follow stats loaded:', response);
        setActualStats(prev => ({
          ...prev,
          followersCount: response.followersCount,
          followingCount: response.followingCount,
        }));
      } else {
        console.warn('⚠️ Failed to load follow stats from Firebase:', response.error);
        
        // If the function doesn't exist, provide fallback with mock data or zero
        if (response.error?.includes('não encontrada') || response.error?.includes('not found')) {
          console.log('📋 Using fallback stats due to missing Firebase function');
          setActualStats(prev => ({
            ...prev,
            followersCount: 4, // Mock count for development
            followingCount: 3, // Mock count for development
          }));
        }
      }
    } catch (err: any) {
      console.error('💥 Exception loading follow stats:', err);
      
      // Provide fallback for development
      console.log('📋 Using fallback stats due to exception');
      setActualStats(prev => ({
        ...prev,
        followersCount: 4, // Mock count for development
        followingCount: 3, // Mock count for development
      }));
    }
  };

  // Mock data generator - Replace with actual API calls
  const generateMockUsers = (type: 'followers' | 'following'): PublicUser[] => {
    const baseUsers = [
      {
        id: '1',
        displayName: 'Ana Silva',
        username: 'anasilva',
        photoURL: 'https://i.pravatar.cc/100?u=ana',
        accountType: 'premium' as const,
        location: { city: 'São Paulo', state: 'SP', country: 'Brasil' },
        listsCount: 12,
        placesCount: 145,
        followersCount: 89,
        followingCount: 67,
        isFollowing: type === 'following',
        hasFollowRequest: false,
        isFollowedBy: type === 'followers',
        mutualFollowersCount: 23,
        commonCategories: ['Restaurantes', 'Cafeterias', 'Parques'],
        commonPlaces: 8,
        joinedAt: '2024-01-15T10:30:00Z',
        isOnline: true,
      },
      {
        id: '2',
        displayName: 'Carlos Mendes',
        username: 'carlosm',
        photoURL: 'https://i.pravatar.cc/100?u=carlos',
        accountType: 'free' as const,
        location: { city: 'Rio de Janeiro', state: 'RJ', country: 'Brasil' },
        listsCount: 8,
        placesCount: 92,
        followersCount: 45,
        followingCount: 123,
        isFollowing: type === 'following',
        hasFollowRequest: false,
        isFollowedBy: type === 'followers',
        mutualFollowersCount: 12,
        commonCategories: ['Bares', 'Música'],
        commonPlaces: 3,
        joinedAt: '2024-02-20T14:15:00Z',
        isOnline: false,
      },
      {
        id: '3',
        displayName: 'Mariana Costa',
        username: 'mari_costa',
        photoURL: 'https://i.pravatar.cc/100?u=mariana',
        accountType: 'free' as const,
        location: { city: 'Belo Horizonte', state: 'MG', country: 'Brasil' },
        listsCount: 15,
        placesCount: 203,
        followersCount: 156,
        followingCount: 89,
        isFollowing: type === 'following',
        hasFollowRequest: false,
        isFollowedBy: type === 'followers',
        mutualFollowersCount: 34,
        commonCategories: ['Arte', 'Cultura', 'Restaurantes'],
        commonPlaces: 12,
        joinedAt: '2023-11-08T09:45:00Z',
        isOnline: true,
      },
      {
        id: '4',
        displayName: 'João Oliveira',
        username: 'joao_oli',
        photoURL: 'https://i.pravatar.cc/100?u=joao',
        accountType: 'premium' as const,
        location: { city: 'Porto Alegre', state: 'RS', country: 'Brasil' },
        listsCount: 6,
        placesCount: 78,
        followersCount: 92,
        followingCount: 145,
        isFollowing: type === 'following',
        hasFollowRequest: false,
        isFollowedBy: type === 'followers',
        mutualFollowersCount: 18,
        commonCategories: ['Esportes', 'Parques'],
        commonPlaces: 5,
        joinedAt: '2024-03-12T16:20:00Z',
        isOnline: false,
      },
    ];

    return baseUsers;
  };

  const generateMockRequests = (): FollowRequest[] => {
    return [
      {
        id: 'req1',
        fromUserId: 'user1',
        toUserId: userId || '',
        fromUser: {
          id: 'user1',
          displayName: 'Pedro Santos',
          username: 'pedro_s',
          photoURL: 'https://i.pravatar.cc/100?u=pedro',
          accountType: 'free',
          location: { city: 'Salvador', state: 'BA', country: 'Brasil' },
          listsCount: 4,
          placesCount: 32,
          followersCount: 28,
          followingCount: 56,
          isFollowing: false,
          hasFollowRequest: true,
          isFollowedBy: false,
          mutualFollowersCount: 7,
          commonCategories: ['Praia', 'Música'],
          commonPlaces: 2,
          joinedAt: '2024-04-01T12:00:00Z',
        },
        toUser: {} as PublicUser,
        status: 'pending',
        createdAt: '2024-08-30T10:30:00Z',
        message: 'Olá! Gostaria de seguir você no Pinubi 😊',
      },
      {
        id: 'req2',
        fromUserId: 'user2',
        toUserId: userId || '',
        fromUser: {
          id: 'user2',
          displayName: 'Luciana Ferreira',
          username: 'luci_f',
          photoURL: 'https://i.pravatar.cc/100?u=luciana',
          accountType: 'premium',
          location: { city: 'Brasília', state: 'DF', country: 'Brasil' },
          listsCount: 9,
          placesCount: 156,
          followersCount: 134,
          followingCount: 89,
          isFollowing: false,
          hasFollowRequest: true,
          isFollowedBy: false,
          mutualFollowersCount: 15,
          commonCategories: ['Restaurantes', 'Arte', 'Cultura'],
          commonPlaces: 6,
          joinedAt: '2024-01-22T08:15:00Z',
        },
        toUser: {} as PublicUser,
        status: 'pending',
        createdAt: '2024-08-29T15:45:00Z',
      },
    ];
  };

  const loadFollowers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading followers...');
      const response = await userService.getFollowers();
      
      if (response.success) {
        console.log('✅ Followers loaded successfully:', response.followers.length);
        setFollowers(response.followers);
      } else {
        console.warn('⚠️ Failed to load followers from Firebase, using fallback');
        setError(response.error || 'Erro ao carregar seguidores');
        
        // Fallback to mock data if Firebase function fails
        if (response.error?.includes('não encontrada') || response.error?.includes('not found')) {
          console.log('📋 Using mock data for followers');
          setFollowers(generateMockUsers('followers'));
        } else {
          setFollowers([]);
        }
      }
    } catch (err: any) {
      console.error('💥 Exception loading followers:', err);
      setError(err.message || 'Erro ao carregar seguidores');
      
      // Fallback to mock data on critical errors
      console.log('📋 Using mock data due to exception');
      setFollowers(generateMockUsers('followers'));
    } finally {
      setLoading(false);
    }
  };

  const loadFollowing = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading following...');
      const response = await userService.getFollowing();
      
      if (response.success) {
        console.log('✅ Following loaded successfully:', response.following.length);
        setFollowing(response.following);
      } else {
        console.warn('⚠️ Failed to load following from Firebase, using fallback');
        setError(response.error || 'Erro ao carregar usuários seguidos');
        
        // Fallback to mock data if Firebase function fails
        if (response.error?.includes('não encontrada') || response.error?.includes('not found')) {
          console.log('📋 Using mock data for following');
          setFollowing(generateMockUsers('following'));
        } else {
          setFollowing([]);
        }
      }
    } catch (err: any) {
      console.error('💥 Exception loading following:', err);
      setError(err.message || 'Erro ao carregar usuários seguidos');
      
      // Fallback to mock data on critical errors
      console.log('📋 Using mock data due to exception');
      setFollowing(generateMockUsers('following'));
    } finally {
      setLoading(false);
    }
  };

  const loadFollowRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await followRequestService.getFollowRequests();
      if (response.success) {
        setFollowRequests(response.requests);
        setActualStats(prev => ({
          ...prev,
          pendingRequestsCount: response.requests.length,
        }));
      } else {
        setError(response.error || 'Erro ao carregar solicitações');
        setFollowRequests([]);
      }
    } catch (err) {
      setError('Erro ao carregar solicitações');
      console.error('Error loading follow requests:', err);
      setFollowRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (targetUserId: string, action: UserActionType) => {
    try {
      setLoading(true);
      
      switch (action) {
        case 'follow':
          const followResult = await userService.followUser(targetUserId);
          if (followResult.success) {
            setFollowing(prev => prev.map(user => 
              user.id === targetUserId 
                ? { ...user, isFollowing: true, hasFollowRequest: false }
                : user
            ));
            await loadFollowStats();
          } else {
            throw new Error(followResult.error || 'Erro ao seguir usuário');
          }
          break;
          
        case 'unfollow':
          const unfollowResult = await userService.unfollowUser(targetUserId);
          if (unfollowResult.success) {
            setFollowing(prev => prev.map(user => 
              user.id === targetUserId 
                ? { ...user, isFollowing: false }
                : user
            ));
            setFollowers(prev => prev.filter(user => user.id !== targetUserId));
            await loadFollowStats();
          } else {
            throw new Error(unfollowResult.error || 'Erro ao deixar de seguir usuário');
          }
          break;

        case 'remove_follower':
          // const removeFollowerResult = await userService.removeFollower(targetUserId);
          // if (removeFollowerResult.success) {
          //   // Update following list
          //   setFollowing(prev => prev.map(user => 
          //     user.id === targetUserId 
          //       ? { ...user, isFollowing: false }
          //       : user
          //   ));
          //   // Remove from followers if they were following back
          //   setFollowers(prev => prev.filter(user => user.id !== targetUserId));
          //   // Refresh stats to get updated counts
          //   await loadFollowStats();
          // } else {
          //   throw new Error(removeFollowerResult.error || 'Erro ao deixar de seguir usuário');
          // }
          break;
          
        case 'cancel_request':
          await new Promise(resolve => setTimeout(resolve, 500));
          setFollowing(prev => prev.map(user => 
            user.id === targetUserId 
              ? { ...user, hasFollowRequest: false }
              : user
          ));
          break;
          
        case 'accept_request':
          // Find the request by user ID instead of request ID
          const requestToAccept = followRequests.find(req => req.fromUserId === targetUserId);
          if (requestToAccept) {
            const acceptResult = await followRequestService.acceptFollowRequest(requestToAccept.id);
            if (acceptResult.success) {
              setFollowRequests(prev => prev.filter(req => req.fromUserId !== targetUserId));
              setFollowers(prev => [...prev, requestToAccept.fromUser]);
              setActualStats(prev => ({
                ...prev,
                pendingRequestsCount: Math.max(0, prev.pendingRequestsCount - 1),
                followersCount: prev.followersCount + 1,
              }));
            } else {
              throw new Error(acceptResult.error || 'Erro ao aceitar solicitação');
            }
          }
          break;
          
        case 'reject_request':
          const requestToReject = followRequests.find(req => req.fromUserId === targetUserId);
          if (requestToReject) {
            const rejectResult = await followRequestService.rejectFollowRequest(requestToReject.id);
            if (rejectResult.success) {
              setFollowRequests(prev => prev.filter(req => req.fromUserId !== targetUserId));
              setActualStats(prev => ({
                ...prev,
                pendingRequestsCount: Math.max(0, prev.pendingRequestsCount - 1),
              }));
            } else {
              throw new Error(rejectResult.error || 'Erro ao rejeitar solicitação');
            }
          }
          break;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar ação');
      console.error('Error handling user action:', err);
      throw err; // Re-throw to be handled by the component
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      
      const response = await userService.searchUsers({ query });
      
      if (response.success) {
        setSearchResults(response.users);
      } else {
        setSearchError(response.error || 'Erro ao buscar usuários');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchError('Erro ao buscar usuários');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearchResults = () => {
    setSearchResults([]);
    setSearchError(null);
  };

  const refresh = async () => {
    await Promise.all([
      loadFollowStats(),
      loadFollowers(),
      loadFollowing(),
      loadFollowRequests(),
    ]);
  };

  // Stats calculation - Use actual stats from API when available, fallback to loaded arrays
  const stats = {
    followersCount: actualStats.followersCount || followers.length,
    followingCount: actualStats.followingCount || following.length,
    pendingRequestsCount: actualStats.pendingRequestsCount || followRequests.length,
  };

  return {
    followers,
    following,
    followRequests,
    searchResults,
    loading,
    searchLoading,
    error,
    searchError,
    stats,
    actions: {
      loadFollowers,
      loadFollowing,
      loadFollowRequests,
      loadFollowStats,
      handleUserAction,
      searchUsers,
      clearSearchResults,
      refresh,
    },
  };
};
