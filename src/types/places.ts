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
  
  // Review system fields
  averageRatings?: PlaceAverageRatings;
  socialMetrics?: {
    [userId: string]: {
      friendsAverage: number;
      friendsCount: number;
      lastUpdated: string;
    };
  };
  updatedAt?: string;
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

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
