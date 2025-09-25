import { AutocompleteOptions, AutocompleteResponse, AutocompleteResult, GooglePlaceDetails, GooglePlaceDetailsResponse, GooglePlacesAutocompleteResponse, GooglePlacesPrediction, PlaceDetailsOptions, PlaceDetailsResponse } from "@pinubi/types";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';


class GooglePlacesService {
  private apiKey: string;

  constructor() {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key não configurada. Verifique EXPO_PUBLIC_GOOGLE_PLACES_API_KEY no .env');
    }
    this.apiKey = GOOGLE_PLACES_API_KEY;
  }

  /**
   * Busca autocomplete para lugares usando Google Places API
   * Prioriza restaurantes e atrações turísticas no Brasil
   */
  async autocomplete(options: AutocompleteOptions): Promise<AutocompleteResponse> {
    try {
      const { input, language = 'pt-BR', country = 'br', types } = options;

      if (!input || input.trim().length < 3) {
        return { success: true, results: [] };
      }

      // Construir URL da API
      const params = new URLSearchParams({
        input: input.trim(),
        key: this.apiKey,
        language,
        components: `country:${country}`,
      });

      // Adicionar tipos específicos se fornecidos
      if (types) {
        params.append('types', types);
      }

      const url = `${GOOGLE_PLACES_BASE_URL}/autocomplete/json?${params.toString()}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GooglePlacesAutocompleteResponse = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(data.error_message || `Google Places API error: ${data.status}`);
      }

      // Processar e classificar resultados
      const results = this.processAutocompleteResults(data.predictions);

      return { success: true, results };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na busca';
      return { success: false, results: [], error: errorMessage };
    }
  }

  /**
   * Busca detalhes de um lugar e retorna no formato ProcessedPlaceDetails
   */
  async getPlaceDetails(placeId: string, options?: PlaceDetailsOptions): Promise<PlaceDetailsResponse> {
    try {
      const { language = 'pt-BR', fields = 'place_id,name,formatted_address,rating,user_ratings_total,types,geometry,photos,price_level,opening_hours,website,international_phone_number' } = options || {};

      // Construir URL da API
      const params = new URLSearchParams({
        place_id: placeId,
        key: this.apiKey,
        language,
        fields
      });

      const url = `${GOOGLE_PLACES_BASE_URL}/details/json?${params.toString()}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GooglePlaceDetailsResponse = await response.json();

      if (data.status !== 'OK') {
        throw new Error(data.error_message || `Google Places API error: ${data.status}`);
      }

      if (data.result) {    
        return { success: true, result: data.result };
      }

      return { success: false, error: 'Nenhum resultado encontrado' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na busca de detalhes';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Busca detalhes de um lugar e retorna no formato PlaceDocument para salvar no Firebase
   */
  async getPlaceForCollection(placeId: string): Promise<any | null> {
    try {
      const fields = 'place_id,name,formatted_address,rating,user_ratings_total,types,geometry,photos,price_level,opening_hours,website,international_phone_number';
      
      // Construir URL da API
      const params = new URLSearchParams({
        place_id: placeId,
        key: this.apiKey,
        language: 'pt-BR',
        fields
      });

      const url = `${GOOGLE_PLACES_BASE_URL}/details/json?${params.toString()}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GooglePlaceDetailsResponse = await response.json();

      if (data.status !== 'OK') {
        throw new Error(data.error_message || `Google Places API error: ${data.status}`);
      }

      if (data.result) {
        return this.createPlaceDocument(data.result);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Processa as previsões do Google em resultados prontos para UI
   * Prioriza restaurantes e atrações turísticas
   */
  private processAutocompleteResults(predictions: GooglePlacesPrediction[]): AutocompleteResult[] {
    const results = predictions.map(prediction => this.transformPrediction(prediction));
    
    // Ordenar por prioridade: restaurantes e atrações turísticas primeiro
    return results.sort((a, b) => {
      // Restaurantes e atrações turísticas têm prioridade
      const aPriority = (a.isRestaurant || a.isTouristAttraction) ? 1 : 0;
      const bPriority = (b.isRestaurant || b.isTouristAttraction) ? 1 : 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Maior prioridade primeiro
      }
      
      // Se mesma prioridade, restaurantes vêm antes de atrações
      if (a.isRestaurant && !b.isRestaurant) return -1;
      if (b.isRestaurant && !a.isRestaurant) return 1;
      
      // Ordenação alfabética como fallback
      return a.title.localeCompare(b.title, 'pt-BR');
    });
  }

  /**
   * Transforma uma predição do Google em resultado de autocomplete
   */
  private transformPrediction(prediction: GooglePlacesPrediction): AutocompleteResult {
    const { structured_formatting, types } = prediction;
    
    return {
      place_id: prediction.place_id,
      title: structured_formatting.main_text,
      subtitle: structured_formatting.secondary_text || '',
      description: prediction.description,
      types,
      isRestaurant: this.isRestaurant(types),
      isTouristAttraction: this.isTouristAttraction(types),
    };
  }

  /**
   * Transforma os detalhes do Google Places para o formato GooglePlaceData
   * usado na coleção places do Firebase
   */
  transformToGooglePlaceData(placeDetails: GooglePlaceDetails): any {
    return {
      placeId: placeDetails.place_id,
      rating: placeDetails.rating || 0,
      userRatingsTotal: placeDetails.user_ratings_total || 0,
      priceLevel: placeDetails.price_level || null,
      types: placeDetails.types || [],
      photos: placeDetails.photos?.map(photo => photo.photo_reference) || [], // Array simplificado de strings
      phone: placeDetails.international_phone_number || null,
      website: placeDetails.website || null,
      formatted_address: placeDetails.formatted_address,
      name: placeDetails.name,
      formatted_phone_number: placeDetails.international_phone_number,
      openingHours: placeDetails.opening_hours ? {
        weekdayText: placeDetails.opening_hours.weekday_text || [],
        openNow: placeDetails.opening_hours.open_now || false,
      } : null,
    };
  }

  /**
   * Cria um PlaceDocument completo para salvar na coleção places do Firebase
   */
  createPlaceDocument(placeDetails: GooglePlaceDetails): any {
    const now = new Date();
    const googlePlaceData = this.transformToGooglePlaceData(placeDetails);
    
    return {
      // Informações básicas
      name: placeDetails.name,
      description: '', // Pode ser preenchido posteriormente
      category: this.determinePrimaryCategory(placeDetails.types || []),
      
      // Endereço estruturado
      address: {
        formatted: placeDetails.formatted_address,
        street: '', // Requer parsing mais detalhado
        city: '', // Requer parsing mais detalhado  
        state: '', // Requer parsing mais detalhado
        country: '', // Requer parsing mais detalhado
        postalCode: '' // Requer parsing mais detalhado
      },
      
      // Coordenadas
      coordinates: {
        latitude: placeDetails.geometry?.location?.lat || 0,
        longitude: placeDetails.geometry?.location?.lng || 0
      },
      
      // Dados do Google Places
      googlePlaceData: googlePlaceData,
      
      // Metadados
      searchKeywords: this.generateSearchKeywords(
        placeDetails.name, 
        placeDetails.types || [], 
        placeDetails.formatted_address
      ),
      
      // Timestamps
      createdAt: now,
      updatedAt: now,
      
      // Flags de controle
      isVerified: false,
      isActive: true
    };
  }

  /**
   * Determina a categoria principal do lugar baseado nos types do Google
   */
  determinePrimaryCategory(types: string[]): string {
    const categoryMap: Record<string, string> = {
      // Restaurants & Food
      'restaurant': 'restaurant',
      'food': 'restaurant',
      'meal_takeaway': 'restaurant',
      'meal_delivery': 'restaurant',
      'cafe': 'cafe',
      'bar': 'bar',
      'bakery': 'restaurant',
      'fast_food': 'restaurant',
      'night_club': 'bar',
      
      // Attractions & Entertainment
      'tourist_attraction': 'attraction',
      'museum': 'attraction',
      'amusement_park': 'attraction',
      'aquarium': 'attraction',
      'art_gallery': 'attraction',
      'zoo': 'attraction',
      'park': 'attraction',
      'natural_feature': 'attraction',
      
      // Shopping
      'shopping_mall': 'shopping',
      'store': 'shopping',
      'clothing_store': 'shopping',
      'electronics_store': 'shopping',
      
      // Services
      'hospital': 'service',
      'bank': 'service',
      'gas_station': 'service',
      'pharmacy': 'service',
    };

    // Encontrar primeira categoria conhecida
    for (const type of types) {
      if (categoryMap[type]) {
        return categoryMap[type];
      }
    }

    // Fallback baseado em tipos comuns
    if (types.some(t => ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar'].includes(t))) {
      return 'restaurant';
    }
    
    if (types.some(t => ['tourist_attraction', 'museum', 'park'].includes(t))) {
      return 'attraction';
    }

    return 'establishment'; // Fallback genérico
  }

  /**
   * Gera keywords de busca baseado no nome e tipos do lugar
   */
  generateSearchKeywords(name: string, types: string[], address?: string): string[] {
    const keywords = new Set<string>();
    
    // Adicionar palavras do nome
    if (name) {
      const nameWords = name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s]/g, ' ') // Remove pontuação
        .split(/\s+/)
        .filter(word => word.length > 2);
      
      nameWords.forEach(word => keywords.add(word));
    }

    // Adicionar tipos traduzidos
    const typeTranslations: Record<string, string[]> = {
      'restaurant': ['restaurante', 'comida'],
      'cafe': ['cafe', 'cafeteria'],
      'bar': ['bar', 'bebida'],
      'tourist_attraction': ['turismo', 'atracao', 'passeio'],
      'museum': ['museu', 'cultura'],
      'park': ['parque', 'natureza'],
    };

    types.forEach(type => {
      keywords.add(type);
      if (typeTranslations[type]) {
        typeTranslations[type].forEach(translation => keywords.add(translation));
      }
    });

    // Adicionar palavras do endereço (cidade, bairro)
    if (address) {
      const addressWords = address.toLowerCase()
        .split(/[,-]/)
        .map(part => part.trim())
        .filter(part => part.length > 2);
      
      addressWords.forEach(word => keywords.add(word));
    }

    return Array.from(keywords);
  }

  /**
   * Verifica se um lugar é um restaurante
   */
  private isRestaurant(types: string[]): boolean {
    const restaurantTypes = [
      'restaurant',
      'food',
      'meal_takeaway',
      'meal_delivery',
      'cafe',
      'bar',
      'bakery',
      'fast_food',
      'night_club'
    ];
    
    return types.some(type => restaurantTypes.includes(type));
  }

  /**
   * Verifica se um lugar é uma atração turística
   */
  private isTouristAttraction(types: string[]): boolean {
    const attractionTypes = [
      'tourist_attraction',
      'museum',
      'amusement_park',
      'aquarium',
      'art_gallery',
      'zoo',
      'park',
      'natural_feature',
      'point_of_interest',
      'establishment'
    ];
    
    return types.some(type => attractionTypes.includes(type));
  }

  /**
   * Verifica se a API está disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Teste simples com uma busca mínima
      const response = await this.autocomplete({ input: 'test' });
      return response.success;
    } catch {
      return false;
    }
  }

  getPhotoUri(photoReference: string, maxWidth: number = 400): string | null {
    if (!photoReference) return null;
  
    // Using legacy Places API photo URL format
    // This matches the photo references returned by the autocomplete and place details APIs
    return `${GOOGLE_PLACES_BASE_URL}/photo?photoreference=${photoReference}&maxwidth=${maxWidth}&key=${this.apiKey}`;
  }
}


export const googlePlacesService = new GooglePlacesService();
