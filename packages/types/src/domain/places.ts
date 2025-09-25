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

export interface FindNearbyPlacesResponse {
  success: boolean;
  data: Place[]; // Always present, empty array if error
  error?: string;
}

export interface GetPlaceDetailsResponse {
  success: boolean;
  data: Partial<PlaceDetailsResponse> | null;
  error?: string;
}

export interface AutocompleteOptions {
  input: string;
  language?: string;
  country?: string;
  types?: string;
}

export interface AutocompleteResponse {
  success: boolean;
  results: AutocompleteResult[];
  error?: string;
}

export interface PlaceDetailsOptions {
  placeId: string;
  language?: string;
  fields?: string;
}

export interface PlaceDetailsResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export interface GooglePlacesAutocompleteResponse {
  predictions: GooglePlacesPrediction[];
  status: string;
  error_message?: string;
}

export interface GooglePlacesPrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings?: MatchedSubstring[];
    secondary_text_matched_substrings?: MatchedSubstring[];
  };
  terms: Term[];
  types: string[];
  matched_substrings: MatchedSubstring[];
  distance_meters?: number;
}

export interface MatchedSubstring {
  length: number;
  offset: number;
}

export interface Term {
  offset: number;
  value: string;
}

export interface GooglePlaceDetailsResponse {
  result: GooglePlaceDetails;
  status: string;
  error_message?: string;
}

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: PlacePhoto[];
  price_level?: number;
  opening_hours?: {
    weekday_text: string[];
    open_now?: boolean;
  };
  reviews?: PlaceReview[];
}

export interface PlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}

export interface PlaceReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

/**
 * Processed autocomplete result ready for UI consumption
 */
export interface AutocompleteResult {
  place_id: string;
  title: string;
  subtitle: string;
  description: string;
  types: string[];
  isRestaurant: boolean;
  isTouristAttraction: boolean;
}

/**
 * Processed place details result ready for application consumption
 */
export interface ProcessedPlaceDetails {
  googlePlaceId: string;
  name: string;
  address: string;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  geometry: {
    location: {
      lat?: number;
      lng?: number;
    };
  };
  photos: {
    photo_reference: string;
    width: number;
    height: number;
  }[];
  price_level?: number;
  opening_hours?: {
    weekday_text: string[];
    open_now?: boolean;
  };
  website?: string;
  international_phone_number?: string;
}
