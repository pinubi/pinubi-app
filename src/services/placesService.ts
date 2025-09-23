import { firestore, functions } from '@/config/firebase';
import type { AutocompleteResult } from '@/types/googlePlaces';
import type { Place } from '@/types/places';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { googlePlacesService } from './googlePlacesService';

export interface CreatePlaceFromGoogleRequest {
  placeId: string;
  googleData?: any; // Optional pre-fetched Google data
}

export interface CreatePlaceFromGoogleResponse {
  success: boolean;
  place: Place | null;
  error?: string;
}

interface FirebaseFunctionResponse {
  success: boolean;
  error?: string;
}

class PlacesService {
  private functions;

  constructor() {
    this.functions = functions;
  }

  /**
   * Criar ou obter lugar do Firestore usando Google Place ID
   * 1. Verifica se já existe no Firestore
   * 2. Se não existe, busca dados do Google Places API
   * 3. Cria o documento no Firestore
   * 4. Retorna o lugar
   */
  async createOrGetPlaceFromGoogle(request: CreatePlaceFromGoogleRequest): Promise<CreatePlaceFromGoogleResponse> {
    const { placeId, googleData } = request;
    let placeDetails: any = null;
    
    try {
      // 1. Verificar se já existe no Firestore
      const placeRef = doc(firestore, 'places', placeId);
      const existingPlace = await getDoc(placeRef);
      
      if (existingPlace.exists()) {
        const placeData = existingPlace.data();
        
        // Converter para formato Place
        const place: Place = this.mapFirestorePlaceToPlace(placeId, placeData);
        return { success: true, place };
      }
      
      // 2. Buscar dados do Google Places API se necessário
      if (googleData) {
        placeDetails = googleData;
      } else {
        const detailsResponse = await googlePlacesService.getPlaceDetails(placeId);        

        if (!detailsResponse || !detailsResponse.success) {
          return {
            success: false,
            place: null,
            error: detailsResponse?.error || 'Não foi possível obter dados do lugar'
          };
        }
        
        placeDetails = detailsResponse.result;
      }
      
      // 3. Create place using Firebase function
      const processAndSaveGooglePlace = httpsCallable(functions, 'processAndSaveGooglePlace');

      const result = await processAndSaveGooglePlace({
        googleData: placeDetails,
        placeId: placeId
      });
      
      const resultData = result.data as FirebaseFunctionResponse;
      
      if (resultData.success) {
        // 4. Fetch the created place from Firestore to return it
        const createdPlaceDoc = await getDoc(placeRef);
        if (createdPlaceDoc.exists()) {
          const createdPlace: Place = this.mapFirestorePlaceToPlace(placeId, createdPlaceDoc.data());
          return { success: true, place: createdPlace };
        } else {
          return { success: false, place: null, error: 'Lugar criado mas não foi possível recuperá-lo' };
        }
      } else {
        return {
          success: false,
          place: null,
          error: resultData.error || 'Erro ao processar lugar via Firebase function'
        };
      }
      
    } catch (error: any) {
      // Check for index requirement error
      if (error.code === 'failed-precondition' && error.message?.includes('index')) {
        return {
          success: false,
          place: null,
          error: `Índice necessário para consulta de lugares. Erro: ${error.message}`
        };
      }
      
      // Check for Firebase Functions errors - try fallback
      if (error.code === 'not-found') {
        console.warn("⚠️ ~ Firebase function 'processAndSaveGooglePlace' not found, trying direct Firestore fallback...");
        return await this.createPlaceDirectFirestore(placeId, placeDetails);
      }
      
      return {
        success: false,
        place: null,
        error: error.message || 'Erro ao criar lugar'
      };
    }
  }

  /**
   * Fallback method to create place directly in Firestore when Firebase function is not available
   */
  private async createPlaceDirectFirestore(placeId: string, placeDetails: any): Promise<CreatePlaceFromGoogleResponse> {
    try {

      
      // Create place data structure similar to what the Firebase function would create
      const placeData = {
        googleData: {
          name: placeDetails.name || 'Nome não disponível',
          address: placeDetails.formatted_address || placeDetails.vicinity || 'Endereço não disponível',
          coordinates: {
            lat: placeDetails.geometry?.location?.lat || 0,
            lng: placeDetails.geometry?.location?.lng || 0
          },
          phone: placeDetails.formatted_phone_number || placeDetails.international_phone_number,
          website: placeDetails.website,
          rating: placeDetails.rating,
          userRatingsTotal: placeDetails.user_ratings_total,
          photos: placeDetails.photos || [],
          types: placeDetails.types || [],
          priceLevel: placeDetails.price_level,
          openingHours: placeDetails.opening_hours,
          lastUpdated: new Date().toISOString()
        },
        searchableText: this.generateSearchableText(
          placeDetails.name,
          placeDetails.formatted_address || placeDetails.vicinity,
          placeDetails.types
        ),
        coordinates: {
          lat: placeDetails.geometry?.location?.lat || 0,
          lng: placeDetails.geometry?.location?.lng || 0
        },
        addedBy: [],
        totalAdds: 0,
        categories: this.extractCategories(placeDetails.types || []),
        createdAt: serverTimestamp(),
        lastGoogleSync: serverTimestamp(),
        isManual: false
      };

      const placeRef = doc(firestore, 'places', placeId);
      await setDoc(placeRef, placeData);
      

      
      // Return the created place
      const createdPlace: Place = this.mapFirestorePlaceToPlace(placeId, {
        ...placeData,
        createdAt: new Date().toISOString(),
        lastGoogleSync: new Date().toISOString()
      });
      
      return { success: true, place: createdPlace };
      
    } catch (fallbackError: any) {
      console.error(`❌ [PlacesService] createPlaceDirectFirestore failed`, fallbackError);
      
      return {
        success: false,
        place: null,
        error: `Erro ao criar lugar diretamente: ${fallbackError.message}`
      };
    }
  }

  /**
   * Buscar ou criar lugar a partir de resultado do autocomplete
   */
  async createOrGetPlaceFromAutocomplete(autocompleteResult: AutocompleteResult): Promise<CreatePlaceFromGoogleResponse> {
    try {
      // Usar o método principal com o placeId
      return await this.createOrGetPlaceFromGoogle({
        placeId: autocompleteResult.place_id
      });
      
    } catch (error: any) {
      return {
        success: false,
        place: null,
        error: error.message || 'Erro ao criar lugar do autocomplete'
      };
    }
  }

  /**
   * Criar lugar manualmente (sem Google Places)
   */
  async createManualPlace(manualData: {
    name: string;
    description: string;
    category: string;
    priceRange: string;
    cuisine?: string;
    userId: string;
  }): Promise<CreatePlaceFromGoogleResponse> {
    try {
      const { name, description, category, priceRange, cuisine, userId } = manualData;
      
      // Gerar ID único para lugar manual
      const placeId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Criar dados do lugar manual
      const manualPlaceData = {
        googleData: {
          name: name.trim(),
          address: 'Endereço não informado',
          coordinates: { lat: 0, lng: 0 }, // Will need to be updated later
          types: [category],
          priceLevel: this.convertPriceRangeToLevel(priceRange),
          lastUpdated: new Date().toISOString()
        },
        searchableText: this.generateSearchableText(name, description, [category, cuisine].filter(Boolean) as string[]),
        coordinates: { lat: 0, lng: 0 },
        addedBy: [userId],
        totalAdds: 1,
        categories: [category],
        createdAt: serverTimestamp(),
        lastGoogleSync: null, // Not from Google
        isManual: true,
        manualData: {
          description: description.trim(),
          cuisine: cuisine?.trim(),
          createdBy: userId
        }
      };
      
      const placeRef = doc(firestore, 'places', placeId);
      await setDoc(placeRef, manualPlaceData);
      
      // Retornar o lugar criado
      const createdPlace: Place = this.mapFirestorePlaceToPlace(placeId, {
        ...manualPlaceData,
        createdAt: new Date().toISOString()
      });
      
      return { success: true, place: createdPlace };
      
    } catch (error: any) {
      return {
        success: false,
        place: null,
        error: error.message || 'Erro ao criar lugar manual'
      };
    }
  }

  /**
   * Mapear dados do Firestore para interface Place
   */
  private mapFirestorePlaceToPlace(placeId: string, data: any): Place {
    return {
      id: placeId,
      googleData: {
        name: data.googleData?.name || data.name || 'Nome não disponível',
        address: typeof data.googleData?.address === 'object' && data.googleData.address?.formatted
          ? data.googleData.address.formatted 
          : typeof data.googleData?.address === 'string'
            ? data.googleData.address 
            : 'Endereço não disponível',
        coordinates: data.googleData?.coordinates || data.coordinates || { lat: 0, lng: 0 },
        phone: data.googleData?.phone || undefined,
        website: data.googleData?.website || undefined,
        rating: data.googleData?.rating || undefined,
        userRatingsTotal: data.googleData?.userRatingsTotal || undefined,
        photos: data.googleData?.photos || [],
        types: data.googleData?.types || [],
        priceLevel: data.googleData?.priceLevel || undefined,
        openingHours: data.googleData?.openingHours || undefined,
        lastUpdated: data.googleData?.lastUpdated || undefined
      },
      searchableText: data.searchableText || '',
      coordinates: data.coordinates || data.googleData?.coordinates || { lat: 0, lng: 0 },
      addedBy: data.addedBy || [],
      totalAdds: data.totalAdds || 0,
      categories: data.categories || data.subcategories || [],
      createdAt: typeof data.createdAt === 'string' 
        ? data.createdAt 
        : data.createdAt?.toDate?.()?.toISOString() || 
          (data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString()),
      lastGoogleSync: typeof data.lastGoogleSync === 'string' 
        ? data.lastGoogleSync 
        : data.lastGoogleSync?.toDate?.()?.toISOString() ||
          (data.lastGoogleSync?.seconds ? new Date(data.lastGoogleSync.seconds * 1000).toISOString() : undefined)
    };
  }

  /**
   * Gerar texto pesquisável para o lugar
   */
  private generateSearchableText(name?: string, address?: string | { formatted?: string }, types?: string[]): string {
    const addressText = typeof address === 'object' ? address?.formatted : address;
    const searchTerms = [
      name,
      addressText,
      ...(types || [])
    ].filter(Boolean);
    
    return searchTerms.join(' ').toLowerCase();
  }

  /**
   * Extrair categorias dos tipos do Google
   */
  private extractCategories(types: string[]): string[] {
    const categoryMap: Record<string, string> = {
      'restaurant': 'restaurant',
      'food': 'restaurant',
      'meal_takeaway': 'restaurant',
      'cafe': 'cafe',
      'bar': 'bar',
      'bakery': 'bakery',
      'tourist_attraction': 'attraction',
      'lodging': 'hotel',
      'shopping_mall': 'shopping',
      'store': 'shopping'
    };
    
    const categories = types
      .map(type => categoryMap[type])
      .filter(Boolean);
    
    return categories.length > 0 ? categories : ['restaurant']; // Default category
  }

  /**
   * Converter faixa de preço para nível numérico
   */
  private convertPriceRangeToLevel(priceRange: string): number {
    switch (priceRange) {
      case '$': return 1;
      case '$$': return 2;
      case '$$$': return 3;
      case '$$$$': return 4;
      default: return 2;
    }
  }
}

export const placesService = new PlacesService();
