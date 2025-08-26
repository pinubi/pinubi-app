import {
  AutocompleteResult,
  GooglePlacesAutocompleteResponse,
  GooglePlacesPrediction,
} from '@/types/googlePlaces';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

interface AutocompleteOptions {
  input: string;
  language?: string;
  country?: string;
  types?: string;
}

interface AutocompleteResponse {
  success: boolean;
  results: AutocompleteResult[];
  error?: string;
}

class GooglePlacesService {
  private apiKey: string;

  constructor() {
    console.log('🔑 Google Places API Key from env:', GOOGLE_PLACES_API_KEY ? `${GOOGLE_PLACES_API_KEY.substring(0, 10)}...` : 'NOT FOUND');
    
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

      console.log('🔍 Google Places Autocomplete request:', { input, language, country });
      console.log('🌐 Request URL (without key):', url.replace(this.apiKey, '[API_KEY]'));

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GooglePlacesAutocompleteResponse = await response.json();

      console.log('📋 Google Places API Response:', { 
        status: data.status, 
        predictions_count: data.predictions?.length || 0,
        error_message: data.error_message 
      });

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(data.error_message || `Google Places API error: ${data.status}`);
      }

      // Processar e classificar resultados
      const results = this.processAutocompleteResults(data.predictions);

      console.log('✅ Google Places Autocomplete results:', {
        total: results.length,
        restaurants: results.filter(r => r.isRestaurant).length,
        attractions: results.filter(r => r.isTouristAttraction).length
      });

      return { success: true, results };
    } catch (error) {
      console.error('❌ Google Places Autocomplete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na busca';
      return { success: false, results: [], error: errorMessage };
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
}

export const googlePlacesService = new GooglePlacesService();
