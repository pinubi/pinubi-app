import { SerperPlace, SerperResponse, SerperSearchParams } from '@/types/places';

// You should add this to your .env file: EXPO_PUBLIC_SERPER_API_KEY=your_api_key_here
const SERPER_API_KEY = process.env.EXPO_PUBLIC_SERPER_API_KEY || 'dc00366c8512d1b703e7758a01462580d1885bc8';
const SERPER_BASE_URL = 'https://google.serper.dev/maps';

class SerperService {
  private async makeRequest(params: SerperSearchParams): Promise<SerperResponse> {
    console.log('🌐 Making Serper API request with params:', params);
    
    const headers = new Headers();
    headers.append('X-API-KEY', SERPER_API_KEY);
    headers.append('Content-Type', 'application/json');

    const zoom = params.zoom || 11;
    const ll = `@${params.latitude},${params.longitude},${zoom}z`;

    const requestBody = {
      q: params.query,
      hl: params.language || 'pt-br',
      ll: ll,
    };

    console.log('📤 Request body:', requestBody);
    console.log('🔑 API Key (first 10 chars):', SERPER_API_KEY.substring(0, 10) + '...');

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    };

    try {
      console.log('🚀 Sending request to:', SERPER_BASE_URL);
      const response = await fetch(SERPER_BASE_URL, requestOptions);
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('❌ API Error:', response.status, response.statusText);
        throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Raw API response:', data);
      
      const parsedResponse = this.parseSerperResponse(data);
      console.log('✨ Parsed response:', parsedResponse);
      
      return parsedResponse;
    } catch (error) {
      console.error('💥 Error fetching places from Serper:', error);
      throw new Error('Não foi possível buscar lugares próximos. Tente novamente.');
    }
  }

  private parseSerperResponse(data: any): SerperResponse {
    console.log('🔍 Parsing Serper response...');
    const places: SerperPlace[] = [];

    if (data.places && Array.isArray(data.places)) {
      console.log('📍 Found places array with', data.places.length, 'items');
      
      data.places.forEach((place: any, index: number) => {
        console.log(`🏪 Processing place ${index + 1}:`, place);
        
        // Check for coordinates in both possible formats
        let latitude: number;
        let longitude: number;
        
        if (place.latitude && place.longitude) {
          // Direct latitude/longitude format
          latitude = parseFloat(place.latitude);
          longitude = parseFloat(place.longitude);
        } else if (place.gps && place.gps.length >= 2) {
          // GPS array format
          latitude = parseFloat(place.gps[0]);
          longitude = parseFloat(place.gps[1]);
        } else {
          console.log('❌ Place missing coordinates:', place.title || 'Unknown');
          return;
        }
        
        // Only add places with valid coordinates
        if (!isNaN(latitude) && !isNaN(longitude)) {
          const parsedPlace: SerperPlace = {
            title: place.title || 'Local sem nome',
            placeId: place.placeId || `${latitude}-${longitude}`,
            address: place.address || 'Endereço não disponível',
            latitude,
            longitude,
            rating: place.rating ? parseFloat(place.rating) : undefined,
            ratingCount: place.ratingCount ? (typeof place.ratingCount === 'string' ? parseInt(place.ratingCount.replace(/[^0-9]/g, '')) : place.ratingCount) : undefined,
            category: place.category || place.type || undefined,
            website: place.website || undefined,
            phoneNumber: place.phoneNumber || undefined,
            hours: place.hours || undefined,
            imageUrl: place.imageUrl || place.thumbnailUrl || undefined,
            priceLevel: place.priceLevel || undefined,
          };

          console.log('✅ Valid place added:', parsedPlace.title, parsedPlace.latitude, parsedPlace.longitude);
          places.push(parsedPlace);
        } else {
          console.log('❌ Invalid coordinates for place:', place.title || 'Unknown', latitude, longitude);
        }
      });
    } else {
      console.log('❌ No places array found in response');
    }

    console.log('🎯 Final parsed places count:', places.length);

    return {
      places,
      searchParameters: data.searchParameters || {
        q: '',
        hl: 'pt-br',
        ll: '',
      },
    };
  }

  async searchNearbyPlaces(params: SerperSearchParams): Promise<SerperPlace[]> {
    const response = await this.makeRequest(params);
    return response.places;
  }

  async searchRestaurants(latitude: number, longitude: number, zoom?: number): Promise<SerperPlace[]> {
    return this.searchNearbyPlaces({
      query: 'restaurantes comida lanchonetes',
      latitude,
      longitude,
      zoom,
      language: 'pt-br',
    });
  }

  async searchFoodPlaces(latitude: number, longitude: number, zoom?: number): Promise<SerperPlace[]> {
    return this.searchNearbyPlaces({
      query: 'restaurantes comida cafés lanchonetes padarias',
      latitude,
      longitude,
      zoom,
      language: 'pt-br',
    });
  }

  async searchAttractions(latitude: number, longitude: number, zoom?: number): Promise<SerperPlace[]> {
    return this.searchNearbyPlaces({
      query: 'pontos turísticos',
      latitude,
      longitude,
      zoom,
      language: 'pt-br',
    });
  }

  async searchGeneral(latitude: number, longitude: number, zoom?: number): Promise<SerperPlace[]> {
    return this.searchNearbyPlaces({
      query: 'rest',
      latitude,
      longitude,
      zoom,
      language: 'pt-br',
    });
  }
}

export const serperService = new SerperService();
