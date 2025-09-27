import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, geofirestore, admin } from '../config/firebase';
import { logger } from 'firebase-functions';
import { GeoPoint, FieldPath } from 'firebase-admin/firestore';
import { Client } from '@googlemaps/google-maps-services-js';
import * as dotenv from 'dotenv';

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}


/**
 * Função auxiliar para buscar detalhes na Google Places API
 * Em produção, implementar com a biblioteca oficial do Google Maps
 */
async function fetchGooglePlaceDetails(placeId: string, language: string = 'pt-BR'): Promise<any> {
  const client = new Client({});
  
  // Get configuration from helper
  const config = getGoogleMapsConfig();
  
  logger.info(`Buscando dados na Google Places API para ${placeId}`, {
    placeId,
    language
  });

  try {
    const response = await client.placeDetails({
      params: {
        place_id: placeId,
        key: config.apiKey,
        language: language as any, // Cast to satisfy TypeScript
        region: config.defaultRegion,
        fields: [
          'place_id', 
          'name', 
          'formatted_address', 
          'geometry',
          'rating', 
          'user_ratings_total', 
          'price_level', 
          'types',
          'photos', 
          'formatted_phone_number', 
          'website', 
          'opening_hours',
          'vicinity',
          'international_phone_number',
          'url',
          'utc_offset',
          'plus_code',
          'business_status',
          'reviews'
        ]
      }
    });
    
    if (response.data.status !== 'OK') {
      logger.error(`Google Places API erro: ${response.data.status}`, {
        placeId,
        status: response.data.status,
        errorMessage: response.data.error_message
      });
      
      // Handle specific error cases
      if (response.data.status === 'NOT_FOUND') {
        return null;
      } else if (response.data.status === 'OVER_QUERY_LIMIT') {
        throw new Error('Limite de consultas excedido na Google Places API');
      } else if (response.data.status === 'REQUEST_DENIED') {
        throw new Error('Acesso negado à Google Places API - verifique as configurações da chave');
      } else {
        throw new Error(`Erro na Google Places API: ${response.data.status}`);
      }
    }
    
    logger.info(`Dados obtidos com sucesso da Google Places API para ${placeId}`, {
      placeId,
      name: response.data.result?.name,
      hasGeometry: !!response.data.result?.geometry,
      rating: response.data.result?.rating
    });
    
    return response.data.result;
    
  } catch (error: any) {
    logger.error('Erro ao chamar Google Places API:', {
      placeId,
      error: error.message,
      stack: error.stack
    });
    
    // Re-throw with more context
    if (error.response?.data) {
      const apiError = error.response.data;
      throw new Error(`Google Places API Error: ${apiError.status} - ${apiError.error_message || error.message}`);
    }
    
    throw error;
  }
}

/**
 * Processar dados da Google Places API para formato interno
 */
function processGooglePlaceData(googleData: any, placeId: string): any {
  const now = new Date();

  // Extrair coordenadas
  const coordinates = googleData.geometry?.location ?
    new GeoPoint(googleData.geometry.location.lat, googleData.geometry.location.lng) :
    null;

  // Processar endereço
  const address = {
    formatted: googleData.formatted_address || '',
    // TODO: Parsing mais detalhado do endereço se necessário
  };

  // Categorizar automaticamente baseado nos types
  const category = categorizePlace(googleData.types || []);

  // Gerar palavras-chave para busca
  const searchableText = generateSearchKeywords(
    googleData.name || '',
    googleData.formatted_address || '',
    category,
    googleData.types || []
  );

  return {
    id: placeId,
    name: googleData.name || 'Local sem nome',
    address,
    coordinates,

    // Dados do Google Maps
    googleData: {
      placeId,
      rating: googleData.rating || 0,
      userRatingsTotal: googleData.user_ratings_total || 0,
      priceLevel: googleData.price_level || null,
      types: googleData.types || [],
      photos: googleData.photos?.map((p: any) => p.photo_reference) || [],
      phone: googleData.formatted_phone_number || null,
      website: googleData.website || null,
      openingHours: googleData.opening_hours ? {
        weekdayText: googleData.opening_hours.weekday_text || [],
        openNow: googleData.opening_hours.open_now || false
      } : null
    },

    // Categorização para filtros
    category,
    subcategories: extractSubcategories(googleData.types || []),
    tags: [], // Será preenchido posteriormente com ML ou manualmente

    // Dados da plataforma (valores iniciais)
    addedBy: [],
    totalAdds: 0,
    averageRatings: {
      overall: 0,
      totalReviews: 0
    },

    // Controle de cache
    lastGoogleSync: now,
    createdAt: now,
    updatedAt: now,
    isActive: true,

    // Busca textual
    searchableText,
    searchKeywords: searchableText.toLowerCase().split(' ').filter(word => word.length > 2)
  };
}

/**
 * Salvar ou atualizar lugar no Firestore e GeoFirestore
 */
async function saveOrUpdatePlace(placeData: any): Promise<void> {
  const placeId = placeData.id;

  try {
    // Verificar se já existe
    const existingDoc = await db.collection('places').doc(placeId).get();

    if (existingDoc.exists) {
      // Atualizar dados existentes, preservando alguns campos da plataforma
      const existingData = existingDoc.data();
      const updatedData = {
        ...placeData,
        // Preservar dados da plataforma que não devem ser sobrescritos
        addedBy: existingData?.addedBy || [],
        totalAdds: existingData?.totalAdds || 0,
        averageRatings: existingData?.averageRatings || placeData.averageRatings,
        createdAt: existingData?.createdAt || placeData.createdAt,
        createdBy: existingData?.createdBy,
        // Preservar categoria original se existir e fizer sentido
        category: existingData?.category && existingData.category !== 'other'
          ? existingData.category
          : placeData.category,
        // Preservar searchKeywords existentes se mais específicas
        searchKeywords: existingData?.searchKeywords || placeData.searchKeywords,
        // Atualizar timestamp
        updatedAt: new Date()
      };

      // Atualizar no GeoFirestore (mantém índices geográficos)
      const geoCollection = geofirestore.collection('places');
      await geoCollection.doc(placeId).set(updatedData);

      logger.info(`Lugar ${placeId} atualizado com sucesso`);
    } else {
      // Criar novo documento
      const geoCollection = geofirestore.collection('places');
      await geoCollection.doc(placeId).set(placeData);

      logger.info(`Lugar ${placeId} criado com sucesso`);
    }
  } catch (error) {
    logger.error(`Erro ao salvar lugar ${placeId}:`, error);
    throw error;
  }
}/**
 * Registrar que um usuário acessou este lugar (para analytics)
 */
async function recordPlaceAccess(userId: string, placeId: string): Promise<void> {
  try {
    // Registrar acesso na coleção de analytics (opcional)
    await db.collection('place_analytics').add({
      userId,
      placeId,
      action: 'view_details',
      timestamp: new Date(),
      source: 'place_details_function'
    });

    // Incrementar contador de visualizações do lugar
    const placeRef = db.collection('places').doc(placeId);
    await placeRef.update({
      'analytics.totalViews': admin.firestore.FieldValue.increment(1),
      'analytics.lastViewed': new Date()
    });

  } catch (error) {
    // Não falhar a função principal se analytics falharem
    logger.warn(`Erro ao registrar analytics para ${placeId}:`, error);
  }
}

/**
 * Categorizar lugar baseado nos types do Google
 */
function categorizePlace(types: string[]): string {
  const categoryMap: { [key: string]: string } = {
    'restaurant': 'restaurant',
    'food': 'restaurant',
    'meal_takeaway': 'restaurant',
    'meal_delivery': 'restaurant',
    'cafe': 'cafe',
    'bar': 'bar',
    'night_club': 'nightlife',
    'tourist_attraction': 'attraction',
    'museum': 'attraction',
    'shopping_mall': 'shopping',
    'store': 'shopping',
    'lodging': 'lodging',
    'hospital': 'healthcare',
    'pharmacy': 'healthcare',
    'school': 'education',
    'university': 'education',
    'gym': 'sports',
    'spa': 'wellness',
    'beauty_salon': 'wellness',
    'gas_station': 'services',
    'bank': 'services',
    'atm': 'services'
  };

  // Buscar primeira categoria conhecida
  for (const type of types) {
    if (categoryMap[type]) {
      return categoryMap[type];
    }
  }

  // Categoria padrão
  return 'other';
}

/**
 * Extrair subcategorias dos types
 */
function extractSubcategories(types: string[]): string[] {
  const relevantTypes = types.filter(type =>
    !['establishment', 'point_of_interest'].includes(type)
  );

  return relevantTypes.slice(0, 5); // Máximo 5 subcategorias
}

/**
 * Gerar texto para busca
 */
function generateSearchKeywords(name: string, address: string, category: string, types: string[]): string {
  const words = [
    name.toLowerCase(),
    address.toLowerCase(),
    category.toLowerCase(),
    ...types.map(t => t.replace(/_/g, ' ').toLowerCase())
  ];

  return words.join(' ');
}

/**
 * Função simplificada para processar e salvar dados do Google Places API
 * Executa apenas duas etapas:
 * 1. Processar dados completos do Google API (processGooglePlaceData)
 * 2. Salvar nova place ou atualizar existente (saveOrUpdatePlace)
 * 
 * @param data.googleData - Dados completos retornados pela Google Places API
 * @param data.placeId - Google Place ID
 */
export const processAndSaveGooglePlace = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { googleData, placeId } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    if (!googleData || !placeId) {
      throw new HttpsError('invalid-argument', 'Dados do Google API e Place ID são obrigatórios');
    }

    try {
      logger.info(`Processando e salvando lugar ${placeId} para usuário ${userId}`, {
        placeId,
        hasName: !!googleData.name,
        hasGeometry: !!googleData.geometry
      });

      // Verificar se usuário está ativo
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists || !userDoc.data()?.isActive) {
        throw new HttpsError('permission-denied', 'Usuário não encontrado ou inativo');
      }

      // Etapa 1: Processar dados da API do Google
      const processedData = processGooglePlaceData(googleData, placeId);

      // Etapa 2: Salvar no Firestore e GeoFirestore
      await saveOrUpdatePlace(processedData);

      logger.info(`Lugar ${placeId} processado e salvo com sucesso`);

      return {
        success: true,
        placeId,
        message: 'Lugar processado e salvo com sucesso',
        data: {
          id: processedData.id,
          name: processedData.name,
          coordinates: processedData.coordinates ? {
            lat: processedData.coordinates.latitude,
            lng: processedData.coordinates.longitude
          } : null,
          category: processedData.category,
          isActive: processedData.isActive
        }
      };

    } catch (error) {
      logger.error(`Erro ao processar lugar ${placeId}:`, error);

      // Re-throw HttpsError as-is, convert others to internal error
      if (error instanceof HttpsError) {
        throw error;
      } else {
        throw new HttpsError('internal', 'Erro interno do servidor');
      }
    }
  }
);

// Função auxiliar para calcular distância entre dois pontos
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
