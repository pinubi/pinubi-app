export interface UserEntity {
  id: string;
  email: string;
  name: string;
  photo: string | null;
  createdAt: string;
  accountType: 'free' | 'premium',
  profileVisibility: 'public' | 'private',
  inviteCode: string,
  maxInvites: number,
  invitesUsed: number,
  invitedBy?: string; // User ID of the inviter
  invitedUsers: string[]; // List of User IDs invited by this user
  // Onboarding and validation states
  isValidated: boolean;  // Has valid invite code
  isActive: boolean;     // Has completed onboarding
  onboardingComplete: boolean; // Completed all onboarding steps
  validatedAt?: string; // When the user was validated

  listsCount: number;
  placesCount: number;
  checkinsCount: number;
}

export type UserPublicProfile = Pick<UserEntity, 'id' | 'name' | 'photo' | 'listsCount' | 'placesCount' | 'checkinsCount'>;

export interface AuthState {
  user: UserEntity | null;
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



