import { firestore, functions } from '@/config/firebase';
import { firebaseService } from '@/services/firebaseService';
import type { AutocompleteResult } from '@/types/googlePlaces';
import type { Place } from '@/types/places';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export interface CreatePlaceFromGoogleRequest {
  placeId: string;
  googleData?: any; // Optional pre-fetched Google data
}

export interface CreatePlaceFromGoogleResponse {
  success: boolean;
  place: Place | null;
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
    try {
      const { placeId, googleData } = request;
      
      console.log('🏢 Creating or getting place from Google:', placeId);
      
      // 1. Verificar se já existe no Firestore
      const placeRef = doc(firestore, 'places', placeId);
      const existingPlace = await getDoc(placeRef);
      
      if (existingPlace.exists()) {
        console.log('✅ Place already exists in Firestore:', placeId);
        const placeData = existingPlace.data();
        
        // Converter para formato Place
        const place: Place = this.mapFirestorePlaceToPlace(placeId, placeData);
        return { success: true, place };
      }
      
      // 2. Buscar dados do Google Places API se necessário
      let placeDetails;
      if (googleData) {
        placeDetails = googleData;
        console.log('📋 Using provided Google data for place:', placeId);
      } else {
        console.log('🔍 Fetching place details from Google for:', placeId);
        const detailsResponse = await firebaseService.getPlaceDetails(placeId);
        
        if (!detailsResponse.success || !detailsResponse.data) {
          return {
            success: false,
            place: null,
            error: detailsResponse.error || 'Não foi possível obter dados do lugar'
          };
        }
        
        placeDetails = detailsResponse.data;
      }
      
      // 3. Criar documento no Firestore
      const newPlaceData = {
        name: placeDetails.googleData?.name || placeDetails.name,
        googleData: {
          name: placeDetails.googleData?.name || placeDetails.name,
          address: {
            formatted: placeDetails.googleData?.address?.formatted || 
                      (typeof placeDetails.googleData?.address === 'string' ? placeDetails.googleData.address : 'Endereço não disponível')
          },
          coordinates: placeDetails.googleData?.coordinates || placeDetails.coordinates || { lat: 0, lng: 0 },
          phone: placeDetails.googleData?.phone || undefined,
          website: placeDetails.googleData?.website || undefined,
          rating: placeDetails.googleData?.rating || undefined,
          userRatingsTotal: placeDetails.googleData?.userRatingsTotal || undefined,
          photos: placeDetails.googleData?.photos || [],
          types: placeDetails.googleData?.types || [],
          priceLevel: placeDetails.googleData?.priceLevel || undefined,
          openingHours: placeDetails.googleData?.openingHours || undefined,
          lastUpdated: new Date().toISOString()
        },
        searchableText: this.generateSearchableText(
          placeDetails.googleData?.name || placeDetails.name, 
          placeDetails.googleData?.address?.formatted || placeDetails.googleData?.address, 
          placeDetails.googleData?.types || []
        ),
        coordinates: placeDetails.googleData?.coordinates || placeDetails.coordinates || { lat: 0, lng: 0 },
        addedBy: [], // Array of user IDs who added this place
        totalAdds: 0,
        categories: this.extractCategories(placeDetails.googleData?.types || []),
        category: this.extractCategories(placeDetails.googleData?.types || [])[0] || 'other',
        isActive: true,
        tags: [],
        subcategories: this.extractCategories(placeDetails.googleData?.types || []),
        averageRatings: {
          overall: placeDetails.googleData?.rating || 0,
          food: 0,
          service: 0,
          ambiance: 0,
          price: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastGoogleSync: serverTimestamp()
      };
      
      await setDoc(placeRef, newPlaceData);
      
      console.log('✅ Successfully created place in Firestore:', placeId);
      
      // 4. Retornar o lugar criado
      const createdPlace: Place = this.mapFirestorePlaceToPlace(placeId, {
        ...newPlaceData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastGoogleSync: new Date().toISOString()
      });
      
      return { success: true, place: createdPlace };
      
    } catch (error: any) {
      console.error('❌ Error creating place from Google:', error);
      return {
        success: false,
        place: null,
        error: error.message || 'Erro ao criar lugar'
      };
    }
  }

  /**
   * Buscar ou criar lugar a partir de resultado do autocomplete
   */
  async createOrGetPlaceFromAutocomplete(autocompleteResult: AutocompleteResult): Promise<CreatePlaceFromGoogleResponse> {
    try {
      console.log('🔍 Creating place from autocomplete result:', autocompleteResult.place_id);
      
      // Usar o método principal com o placeId
      return await this.createOrGetPlaceFromGoogle({
        placeId: autocompleteResult.place_id
      });
      
    } catch (error: any) {
      console.error('❌ Error creating place from autocomplete:', error);
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
      
      console.log('📝 Creating manual place:', name);
      
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
      
      console.log('✅ Successfully created manual place:', placeId);
      
      // Retornar o lugar criado
      const createdPlace: Place = this.mapFirestorePlaceToPlace(placeId, {
        ...manualPlaceData,
        createdAt: new Date().toISOString()
      });
      
      return { success: true, place: createdPlace };
      
    } catch (error: any) {
      console.error('❌ Error creating manual place:', error);
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
        address: typeof data.googleData?.address === 'object' 
          ? data.googleData.address.formatted || 'Endereço não disponível'
          : data.googleData?.address || 'Endereço não disponível',
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
