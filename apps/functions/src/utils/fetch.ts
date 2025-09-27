import { Client } from '@googlemaps/google-maps-services-js';
import { PlaceEntity } from '@pinubi/types';
import { logger } from 'firebase-functions';
import { getGoogleMapsConfig } from '../config/googleMaps';

export async function fetchGooglePlaceDetails(placeId: string, language: string = 'pt-BR'): Promise<PlaceEntity> {
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
    
    return {
      id: response.data.result.place_id,
      googleData: {
        name: response.data.result.name,
        address: response.data.result.formatted_address,
        coordinates: {
          lat: response.data.result.geometry.location.lat,
          lng: response.data.result.geometry.location.lng
        },
        phone: response.data.result.international_phone_number || response.data.result.formatted_phone_number,
        website: response.data.result.website,
        rating: response.data.result.rating,
        types: response.data.result.types || [],
        priceLevel: response.data.result.price_level,
        openingHours: {
          weekdayText: response.data.result.opening_hours?.weekday_text || []
        },
      },
      totalRatings: 0,
      averageRating: 0,
      totalReviews: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
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