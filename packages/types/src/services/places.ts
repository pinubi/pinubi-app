import { Reviews } from "./review";

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

export interface CreatePlaceFromGoogleRequest {
  placeId: string;
  googleData?: any; // Optional pre-fetched Google data
}

export interface CreatePlaceFromGoogleResponse {
  success: boolean;
  place: Place | null;
  error?: string;
}

export interface FirebaseFunctionResponse {
  success: boolean;
  error?: string;
}

interface ResponseMeta {
  fromCache: boolean;
  lastUpdate?: string;
  language: string;
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

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}


interface UserPlaceInteraction {
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