export interface Place {
  id: string;
  googleData: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
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
  coordinates: {
    lat: number;
    lng: number;
  };
  addedBy?: string[];
  totalAdds?: number;
  categories?: string[];
  createdAt?: string;
  lastGoogleSync?: string;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
