/**
 * Google Places API Response Types
 * Used for Autocomplete and Place Details integration
 */

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
