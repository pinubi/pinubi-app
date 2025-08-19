export interface SerperPlace {
  title: string;
  placeId: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  ratingCount?: number;
  category?: string;
  website?: string;
  phoneNumber?: string;
  hours?: string;
  imageUrl?: string;
  priceLevel?: string;
}

export interface SerperSearchParams {
  query: string;
  latitude: number;
  longitude: number;
  zoom?: number;
  language?: string;
}

export interface SerperResponse {
  places: SerperPlace[];
  searchParameters: {
    q: string;
    hl: string;
    ll: string;
  };
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
