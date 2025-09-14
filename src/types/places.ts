export interface PlaceAverageRatings {
  overall: number;
  food?: number;
  drink?: number;
  dessert?: number;
  service?: number;
  ambiance?: number;
  totalReviews: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface PlaceDetailsResponse {
  success: boolean;
  place: Place;
  fromCache: boolean;
  _meta: ResponseMeta;
  userLists?: UserPlaceList[];
  userInteraction?: UserPlaceInteraction | null;
  reviews?: Reviews | null;
}

export interface Place {
  id: string;
  googleData: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
    phone?: string;
    website?: string;
    rating?: number;
    userRatingsTotal?: number;
    photos?: string[];
    types?: string[];
    priceLevel?: number;
    openingHours?: {
      openNow?: boolean;
      weekdayText?: string[];
    };
    lastUpdated?: string;
  };
  searchableText?: string;
  coordinates: { lat: number; lng: number };
  addedBy?: string[];
  totalAdds?: number;
  categories?: string[];
  createdAt?: string;
  lastGoogleSync?: string;
  updatedAt?: string;
}

interface ResponseMeta {
  fromCache: boolean;
  lastUpdate?: string;
  language: string;
}

export interface UserPlaceList {
  id: string;
  title: string;
  emoji: string;
  visibility: 'public' | 'private' | 'friends';
  addedAt: string; // ISO string
  personalNote: string;
  tags: string[];
  priority: number;
}

export interface UserPlaceInteraction {
  userId: string;
  placeId: string;
  isVisited: boolean;
  isFavorite: boolean;
  isWantToVisit: boolean;
  totalReviews: number;
  lastInteractionAt: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Reviews {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  rating: number;
  reviewType: string;
  comment?: string;
  wouldReturn: boolean;
  isVisited: boolean;
  photos: string[];
  tags: string[];
  visitDate: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
