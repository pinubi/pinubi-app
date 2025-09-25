export interface FeedItem {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  type: 'place_added' | 'place_visited' | 'place_reviewed' | 'list_created' | 'list_purchased' | 'user_followed';
  data: ActivityData;
  relevanceScore: number;
  distance?: number;
  isFollowing: boolean;
  createdAt: string;
}

export interface ActivityData {
  // Para place_added, place_visited, place_reviewed
  placeId?: string;
  placeName?: string;
  placeAddress?: string;
  placeCoordinates?: {
    lat: number;
    lng: number;
  };
  placeCategories?: string[];
  placePhotos?: string[];

  // Para place_reviewed
  rating?: number;
  reviewComment?: string;
  wouldReturn?: boolean;
  reviewPhotos?: string[];

  // Para list_created, list_purchased
  listId?: string;
  listTitle?: string;
  listEmoji?: string;
  listDescription?: string;
  listCategory?: string;
  listPlacesCount?: number;
  listPrice?: number;

  // Para user_followed
  followedUserId?: string;
  followedUserName?: string;
  followedUserAvatar?: string;

  // Campos comuns
  comment?: string;
  photos?: string[];
  tags?: string[];
}

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

export interface GetFeedResponse {
  items: FeedItem[];
  hasMore: boolean;
  lastTimestamp?: string;
}

export interface GetDiscoveryFeedResponse {
  places: TrendingPlace[];
  region: string;
}

export interface FeedFilters {
  limit?: number;
  includeGeographic?: boolean;
  maxDistance?: number;
  types?: string[];
  friendsOnly?: boolean;
  lastTimestamp?: string;
}

export interface DiscoveryFilters {
  limit?: number;
  maxDistance?: number;
}

export interface FeedError {
  code: string;
  message: string;
}

// Interfaces para compatibilidade com o UI atual
export interface VotingOption {
  id: string;
  name: string;
  votes: number;
  percentage: number;
  hasVoted: boolean;
}

export interface ActivityPost {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  type: 'voting' | 'list' | 'review' | 'place_added' | 'place_visited' | 'list_created';
  timestamp: string;
  content: {
    title: string;
    description?: string;
    category?: string;
    options?: VotingOption[];
    photos?: string[];
    rating?: number;
    placeAddress?: string;
    placeName?: string;
  };
  interactions: {
    likes: number;
    comments: number;
    hasLiked: boolean;
  };
}
