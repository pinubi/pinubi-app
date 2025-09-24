// ======================
// TIPOS DE USUÁRIO
// ======================

export interface User {
  id?: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailVerified?: boolean;
  fcmToken?: string;
  fcmTokenUpdatedAt?: any;
  createdAt?: any;
  updatedAt?: any;
  deactivatedAt?: any;
  deactivatedBy?: string;
  forcedLogoutAt?: any;
  forcedLogoutBy?: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email?: string;
  bio?: string;
  avatar?: string;
  isActive: boolean;
  profileComplete: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserSettings {
  userId: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showEmail: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
  createdAt?: any;
  updatedAt?: any;
}

// ======================
// TIPOS DE NOTIFICAÇÃO
// ======================

export interface NotificationData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  messageId?: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt?: any;
  createdAt?: any;
}

export interface BulkNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  targetUserIds: string[];
  totalSent: number;
  totalFailed: number;
  sentBy: string;
  sentAt?: any;
  createdAt?: any;
}

// ======================
// TIPOS ADMINISTRATIVOS
// ======================

export interface AdminAction {
  id?: string;
  action: 'promote-to-admin' | 'revoke-admin' | 'force-logout' | 'cleanup-test-data' | string;
  targetUserId?: string;
  performedBy: string;
  performedAt?: any;
  metadata?: Record<string, any>;
}

export interface SystemStats {
  users: {
    total: number;
    active: number;
    newToday: number;
  };
  notifications: {
    sentToday: number;
  };
  generatedAt: string;
  generatedBy: string;
}

export interface WeeklyReport {
  period: {
    from: string;
    to: string;
  };
  stats: {
    totalActiveUsers: number;
    newUsersThisWeek: number;
    notificationsSent: number;
  };
  generatedAt?: any;
}

// ======================
// TIPOS DE RESPOSTA
// ======================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  reason?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  hasMore: boolean;
  total?: number;
}

// ======================
// TIPOS DE ENTRADA
// ======================

export interface CreateUserInput {
  email: string;
  password: string;
  displayName?: string;
  role?: 'user' | 'admin';
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatar?: string;
}

export interface SendNotificationInput {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface SendBulkNotificationInput {
  title: string;
  body: string;
  userIds?: string[];
  data?: Record<string, any>;
}

export interface ListUsersInput {
  limit?: number;
  startAfter?: any;
}

// ======================
// TIPOS DE REVIEW
// ======================

export interface Review {
  id?: string;
  userId: string;
  placeId: string;
  rating: number; // 0-10 com decimais
  reviewType: 'food' | 'drink' | 'dessert' | 'service' | 'ambiance' | 'overall';
  wouldReturn: boolean;
  comment?: string;
  photos?: PhotoData[];
  isVisited: boolean;
  visitDate?: any; // Firestore Timestamp
  likes: number;
  likedBy: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface PhotoData {
  url: string;
  thumbnail?: string;
  size: number;
  width: number;
  height: number;
}

export interface PlaceAverageRatings {
  overall: number;
  food?: number;
  drink?: number;
  dessert?: number;
  service?: number;
  ambiance?: number;
  totalReviews: number;
}

export interface UserPlaceInteraction {
  id: string;
  userId: string;
  placeId: string;
  isVisited: boolean;
  isWantToVisit: boolean;
  isFavorite: boolean;
  reviews: {
    reviewId: string;
    type: string;
    rating: number;
  }[];
  personalAverage: number;
  totalReviews: number;
  lastVisit?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface CreateReviewInput {
  placeId: string;
  rating: number;
  reviewType: 'food' | 'drink' | 'dessert' | 'service' | 'ambiance' | 'overall';
  wouldReturn: boolean;
  comment?: string;
  photos?: PhotoData[];
  isVisited: boolean;
  visitDate?: string;
}

export interface UpdateReviewInput {
  reviewId: string;
  rating?: number;
  reviewType?: 'food' | 'drink' | 'dessert' | 'service' | 'ambiance' | 'overall';
  wouldReturn?: boolean;
  comment?: string;
  photos?: PhotoData[];
  visitDate?: string;
}

// ======================
// TIPOS DE CONTEXTO
// ======================

export interface AuthContext {
  uid: string;
  email?: string;
  token?: any;
}

export interface CallableContext {
  auth?: AuthContext;
  data: any;
}

// ======================
// TIPOS DE FEED
// ======================

export interface FeedItem {
  id: string;
  userId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  type: 'place_added' | 'place_visited' | 'place_reviewed' | 'list_created' | 'list_purchased' | 'list_monetized' | 'user_followed';
  data: any;
  activityId: string;
  relevanceScore: number;
  distance?: number; // em km
  isFollowing: boolean;
  createdAt: any;
}

export interface FeedQuery {
  userId: string;
  limit?: number;
  lastTimestamp?: any;
  types?: string[];
  friendsOnly?: boolean;
  maxDistance?: number; // em km
  includeGeographic?: boolean;
}

export interface FeedResponse {
  success: boolean;
  items: FeedItem[];
  hasMore: boolean;
  timestamp: string;
  nextPageToken?: string;
}

export interface RelevanceFactors {
  socialProximity: number; // 0-10
  geographicProximity: number; // 0-10
  categoryMatch: number; // 0-10
  recency: number; // 0-10
  engagement: number; // 0-10
}

export interface TrendingPlace {
  placeId: string;
  placeName: string;
  placeAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  activityCount: number;
  distance: number;
  avgRating?: number;
  reviewCount?: number;
  categories: string[];
  photos?: string[];
}

export interface DiscoveryFeedResponse {
  success: boolean;
  trendingPlaces: TrendingPlace[];
  region: string;
  radius: number;
}

// ======================
// TIPOS DE ATIVIDADE DO FEED
// ======================

export interface FeedActivity {
  id: string;
  userId: string;
  type: 'place_added' | 'place_visited' | 'place_reviewed' | 'list_created' | 'list_purchased' | 'list_monetized' | 'user_followed';
  data: PlaceActivityData | ListActivityData | UserActivityData;
  isPublic: boolean;
  createdAt: any;
}

export interface PlaceActivityData {
  placeId: string;
  placeName: string;
  placeAddress?: string;
  placeCoordinates?: {
    lat: number;
    lng: number;
  };
  placeCategories?: string[];
  listId?: string;
  listName?: string;
  rating?: number;
  reviewType?: string;
  wouldReturn?: boolean;
  comment?: string;
  photos?: string[];
}

export interface ListActivityData {
  listId: string;
  listName: string;
  listEmoji?: string;
  placesCount: number;
  isMonetized: boolean;
  price?: number;
  categories?: string[];
  tags?: string[];
}

export interface UserActivityData {
  followedUserId: string;
  followedUserName: string;
  mutualFollows?: number;
}
