export interface User {
  id: string;
  email: string;
  name: string;
  photo: string | null;
  familyName?: string;
  givenName?: string;
  createdAt: string;
  // Onboarding and validation states
  isValidated?: boolean;  // Has valid invite code
  isActive?: boolean;     // Has completed onboarding
  onboardingComplete?: boolean; // Completed all onboarding steps
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export type UserActionType = 'follow' | 'unfollow' | 'remove_follower' | 'cancel_request' | 'accept_request' | 'reject_request';

export type FollowRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface PublicUser {
  id: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  accountType: 'free' | 'premium';
  location?: {
    city: string;
    state: string;
    country: string;
  };

  // Stats
  listsCount: number;
  placesCount: number;
  followersCount: number;
  followingCount: number;

  // Social context
  isFollowing: boolean;
  hasFollowRequest: boolean;
  isFollowedBy: boolean;
  mutualFollowersCount?: number;

  // Common interests & places
  commonCategories?: string[];
  commonPlaces?: number;

  // Additional metadata
  joinedAt: string;
  lastActiveAt?: string;
  isOnline?: boolean;
}

export interface FollowRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: PublicUser;
  toUser: PublicUser;
  status: FollowRequestStatus;
  createdAt: string;
  updatedAt?: string;
  message?: string;
}

export interface FollowRelationship {
  id: string;
  followerId: string;
  followingId: string;
  follower: PublicUser;
  following: PublicUser;
  createdAt: string;
  isActive: boolean;
}

export interface UserSearchResult {
  users: PublicUser[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface UserSearchFilters {
  query?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  accountType?: 'free' | 'premium';
  hasCommonInterests?: boolean;
  mutualFollowers?: boolean;
}

export interface UserStats {
  totalUsers: number;
  followersCount: number;
  followingCount: number;
  pendingRequestsCount: number;
  mutualFollowersCount: number;
}



