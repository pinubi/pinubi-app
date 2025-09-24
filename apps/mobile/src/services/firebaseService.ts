import { functions } from '@/config/firebase';
import { Place, PlaceDetailsResponse } from '@pinubi/types';
import { httpsCallable } from 'firebase/functions';

interface FindNearbyPlacesResponse {
  success: boolean;
  data: Place[]; // Always present, empty array if error
  error?: string;
}

interface GetPlaceDetailsResponse {
  success: boolean;
  data: Partial<PlaceDetailsResponse> | null;
  error?: string;
}

class FirebaseService {
  private functions;

  constructor() {
    this.functions = functions;
  }

  async findNearbyPlaces(latitude: number, longitude: number, radius = 5): Promise<FindNearbyPlacesResponse> {
    try {
      const findNearbyPlaces = httpsCallable(this.functions, 'findNearbyPlaces');
      const result = await findNearbyPlaces({ latitude, longitude, radius });

      // Handle the actual response format from Firebase
      const responseData = result.data as any;

      if (responseData && responseData.places && Array.isArray(responseData.places)) {
        // Map the Firebase response format to Place format (based on Database Schema)
        const mappedPlaces: Place[] = responseData.places.map((place: any, index: number) => {
          // Extract coordinates - they should be in the format from your schema
          // Your log shows coordinates object with latitude/longitude, so let's handle both formats
          let lat = 0;
          let lng = 0;

          if (place.coordinates) {
            lat = place.coordinates.lat || place.coordinates._latitude || 0;
            lng = place.coordinates.lng || place.coordinates._longitude || 0;
          }

          const mappedPlace: Place = {
            id: place.id || `place-${Date.now()}-${Math.random()}`,
            googleData: {
              name: place.name || 'Local sem nome',
              address: place.address || 'Endereço não disponível',
              coordinates: {
                lat,
                lng,
              },
              phone: place.phone,
              website: place.website,
              rating: place.rating ? parseFloat(place.rating) : undefined,
              userRatingsTotal: place.totalReviews || place.userRatingsTotal,
              photos: place.googleData?.photos,
              types: place.types || place.categories,
              priceLevel: place.priceLevel,
              openingHours: place.openingHours,
              lastUpdated: place.lastUpdated,
              ...place.googleData,
            },
            searchableText: place.searchableText,
            coordinates: {
              lat,
              lng,
            },
            addedBy: place.addedBy,
            totalAdds: place.totalAdds,
            categories: place.categories,
            createdAt: place.createdAt,
            lastGoogleSync: place.lastGoogleSync,
          };

          return mappedPlace;
        });

        return { success: true, data: mappedPlaces };
      } else {
        return { success: true, data: [] };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';
      return { success: false, error: errorMessage, data: [] };
    }
  }

  /**
   * Obter detalhes completos de um lugar usando Place ID
   * Implementa cache inteligente: busca no Firebase primeiro, depois Google API se necessário
   */
  async getPlaceDetails(placeId: string, forceRefresh = false, language = 'pt-BR'): Promise<GetPlaceDetailsResponse> {
    try {
      const getPlaceDetails = httpsCallable(this.functions, 'getPlaceDetails');
      const result = await getPlaceDetails({
        placeId,
        forceRefresh,
        language,
      });

      const responseData = result.data as any;

      if (responseData && responseData.place) {
        const place = responseData.place;

        // Extract coordinates
        let lat = 0;
        let lng = 0;

        if (place.coordinates) {
          lat = place.coordinates.lat || place.coordinates._latitude || 0;
          lng = place.coordinates.lng || place.coordinates._longitude || 0;
        }

        const mappedPlace: Place = {
          id: place.id || placeId,
          googleData: {
            name: place.name || 'Local sem nome',
            address: place.address || 'Endereço não disponível',
            coordinates: {
              lat,
              lng,
            },
            phone: place.googleData.phone,
            website: place.googleData.website,
            rating: place.googleData.rating ? parseFloat(place.googleData.rating) : undefined,
            userRatingsTotal: place.googleData.totalReviews || place.googleData.userRatingsTotal,
            photos: place.googleData.photos,
            types: place.googleData.types || place.googleData.categories,
            priceLevel: place.googleData.priceLevel,
            openingHours: place.googleData.openingHours,
            lastUpdated: place.googleData.lastUpdated,
          },
          searchableText: place.searchableText,
          coordinates: {
            lat,
            lng,
          },
          addedBy: place.addedBy,
          totalAdds: place.totalAdds,
          categories: place.categories,
          createdAt: place.createdAt,
          lastGoogleSync: place.lastGoogleSync,
        };

        return { success: true, data: { ...responseData, place: mappedPlace } };
      } else {
        return { success: false, data: null, error: 'Local não encontrado' };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao buscar detalhes do local';
      return { success: false, error: errorMessage, data: null };
    }
  }
}

export const firebaseService = new FirebaseService();
