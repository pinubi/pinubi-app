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

// Google Maps configuration helper
const getGoogleMapsConfig = () => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY não configurada nas variáveis de ambiente');
  }
  
  return {
    apiKey,
    defaultLanguage: process.env.GOOGLE_MAPS_DEFAULT_LANGUAGE || 'pt-BR',
    defaultRegion: process.env.GOOGLE_MAPS_DEFAULT_REGION || 'BR'
  };
};

/**
 * Buscar lugares próximos usando GeoFirestore
 * @param data.latitude - Latitude do ponto de busca
 * @param data.longitude - Longitude do ponto de busca  
 * @param data.radius - Raio de busca em km (padrão: 10km)
 */
export const findNearbyPlaces = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { latitude, longitude, radius = 10 } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    if (!latitude || !longitude) {
      throw new HttpsError('invalid-argument', 'Latitude e longitude são obrigatórias');
    }

    try {
      logger.info(`Buscando lugares próximos para usuário ${userId}`, {
        latitude,
        longitude,
        radius
      });

      // Coleção geo-habilitada para lugares
      const geoCollection = geofirestore.collection('places');

      // Busca por raio
      const query = geoCollection.near({
        center: new GeoPoint(latitude, longitude),
        radius: radius
      });

      const snapshot = await query.get();

      const places = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        places.push({
          id: doc.id,
          name: data.googleData?.name || data.name,
          googleData: data.googleData,
          description: data.description,
          category: data.categories?.[0] || data.category,
          categories: data.categories,
          coordinates: data.coordinates,
          address: data.googleData?.formatted_address || data.address,
          rating: data.googleData?.rating || data.averageRatings?.overall || 0,
          averageRatings: data.averageRatings,
          totalReviews: data.averageRatings?.totalReviews || 0,
          // Distância calculada automaticamente pelo geofirestore
          distance: data.distance || doc.distance || 0
        });
      });

      logger.info(`Encontrados ${places.length} lugares próximos`);

      return {
        success: true,
        places,
        total: places.length
      };

    } catch (error) {
      logger.error('Erro ao buscar lugares próximos:', error);
      throw new HttpsError('internal', 'Erro interno do servidor');
    }
  }
);

/**
 * Adicionar um novo lugar com coordenadas geográficas
 */
export const addPlaceWithLocation = onCall(
  { region: 'us-central1' },
  async (request) => {
    const {
      name,
      description,
      category,
      latitude,
      longitude,
      address
    } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    if (!name || !latitude || !longitude) {
      throw new HttpsError('invalid-argument', 'Nome, latitude e longitude são obrigatórios');
    }

    try {
      // Verificar se usuário existe e está ativo
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists || !userDoc.data()?.isActive) {
        throw new HttpsError('permission-denied', 'Usuário não encontrado ou inativo');
      }

      const placeId = db.collection('places').doc().id;

      // Dados do lugar com coordenadas
      const placeData = {
        id: placeId,
        name,
        description,
        category,
        coordinates: new GeoPoint(latitude, longitude),
        address,
        averageRating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      };

      // Salvar usando GeoFirestore (adiciona automaticamente o índice geográfico)
      const geoCollection = geofirestore.collection('places');
      await geoCollection.doc(placeId).set(placeData);

      logger.info(`Lugar criado com sucesso: ${placeId}`, {
        userId,
        placeId,
        coordinates: [latitude, longitude]
      });

      return {
        success: true,
        placeId,
        message: 'Lugar adicionado com sucesso'
      };

    } catch (error) {
      logger.error('Erro ao adicionar lugar:', error);

      // Re-throw HttpsError as-is, convert others to internal error
      if (error instanceof HttpsError) {
        throw error;
      } else {
        throw new HttpsError('internal', 'Erro interno do servidor');
      }
    }
  }
);

/**
 * Atualizar coordenadas de um lugar existente
 */
export const updatePlaceLocation = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { placeId, latitude, longitude } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    if (!placeId || !latitude || !longitude) {
      throw new HttpsError('invalid-argument', 'ID do lugar, latitude e longitude são obrigatórios');
    }

    try {
      // Verificar se o lugar existe e se o usuário tem permissão
      const geoCollection = geofirestore.collection('places');
      const placeDoc = await geoCollection.doc(placeId).get();

      if (!placeDoc.exists) {
        throw new HttpsError('not-found', 'Lugar não encontrado');
      }

      const placeData = placeDoc.data();
      if (placeData.createdBy !== userId) {
        throw new HttpsError('permission-denied', 'Sem permissão para editar este lugar');
      }

      // Atualizar coordenadas
      await geoCollection.doc(placeId).update({
        coordinates: new GeoPoint(latitude, longitude),
        updatedAt: new Date()
      });

      logger.info(`Coordenadas do lugar atualizadas: ${placeId}`, {
        userId,
        newCoordinates: [latitude, longitude]
      });

      return {
        success: true,
        message: 'Coordenadas atualizadas com sucesso'
      };

    } catch (error) {
      logger.error('Erro ao atualizar coordenadas:', error);

      // Re-throw HttpsError as-is, convert others to internal error
      if (error instanceof HttpsError) {
        throw error;
      } else {
        throw new HttpsError('internal', 'Erro interno do servidor');
      }
    }
  }
);

/**
 * Buscar lugares com paginação baseada em mapa e raio
 * @param data.center - Coordenadas do centro do mapa { lat, lng }
 * @param data.radius - Raio de busca em km
 * @param data.filters - Filtros opcionais (categoria, tags, avaliação mínima)
 * @param data.pagination - Controle de paginação { limit, offset }
 * @param data.bounds - Limites do mapa visível { northeast, southwest }
 */
export const getPlacesInMapView = onCall(
  { region: 'us-central1' },
  async (request) => {
    const {
      center,
      radius = 10,
      filters = {},
      pagination = { limit: 50, offset: 0 },
      bounds
    } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    if (!center?.lat || !center?.lng) {
      throw new HttpsError('invalid-argument', 'Coordenadas do centro são obrigatórias');
    }

    try {
      logger.info(`Buscando lugares no mapa para usuário ${userId}`, {
        center,
        radius,
        filters,
        pagination
      });

      // Verificar se usuário está ativo
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists || !userDoc.data()?.isActive) {
        throw new HttpsError('permission-denied', 'Usuário não encontrado ou inativo');
      }

      const geoCollection = geofirestore.collection('places');

      // Query geográfica base - fazer só o filtro geográfico primeiro
      let geoQuery = geoCollection.near({
        center: new GeoPoint(center.lat, center.lng),
        radius: radius
      });

      // Note: GeoFirestore tem limitações com combinação de filtros
      // Vamos fazer filtragem geográfica primeiro, depois filtros adicionais em memória

      // Aplicar paginação
      const startAfterIndex = pagination.offset || 0;
      if (startAfterIndex > 0) {
        // Para GeoQuery, usaremos skip manualmente após obter resultados
      }
      geoQuery = geoQuery.limit(Math.max(pagination.limit, 100)); // Buscar mais para depois filtrar

      const snapshot = await geoQuery.get();

      const places: any[] = [];
      const promises: any[] = [];

      let currentIndex = 0;
      snapshot.forEach((doc) => {
        // Skip manual para paginação
        if (currentIndex < startAfterIndex) {
          currentIndex++;
          return;
        }

        // Parar se já temos o limite necessário
        if (places.length + promises.length >= pagination.limit) {
          return;
        }

        const data = doc.data();

        // Aplicar filtros adicionais em memória (após filtro geográfico)

        // Filtro de categoria
        if (filters.category && filters.category !== 'todos' && data.category !== filters.category) {
          currentIndex++;
          return; // Pular este lugar
        }

        // Filtro de status ativo
        if (filters.isActive !== undefined && data.isActive !== filters.isActive) {
          currentIndex++;
          return; // Pular este lugar
        }

        // Filtro de rating mínimo
        if (filters.minRating && filters.minRating > 0) {
          const averageRating = data.averageRatings?.overall || data.averageRating || 0;
          if (averageRating < filters.minRating) {
            currentIndex++;
            return; // Pular este lugar
          }
        }

        // Se há limites do mapa, verificar se o lugar está dentro
        if (bounds) {
          const placeCoords = data.coordinates;
          if (placeCoords) {
            const isInBounds = (
              placeCoords.latitude <= bounds.northeast.lat &&
              placeCoords.latitude >= bounds.southwest.lat &&
              placeCoords.longitude <= bounds.northeast.lng &&
              placeCoords.longitude >= bounds.southwest.lng
            );

            if (!isInBounds) {
              currentIndex++;
              return; // Pular este lugar
            }
          }
        }

        // Aplicar filtro de tags se fornecido
        if (filters.tags && filters.tags.length > 0) {
          const placeTags = data.tags || [];
          const hasMatchingTag = filters.tags.some((tag: string) =>
            placeTags.includes(tag)
          );
          if (!hasMatchingTag) {
            currentIndex++;
            return; // Pular este lugar
          }
        }

        const placeData: any = {
          id: doc.id,
          ...data,
          distance: data.distance
        };

        // Se o usuário quer dados de reviews, buscar async
        if (filters.includeReviews) {
          const reviewPromise = db.collection('reviews')
            .where('placeId', '==', doc.id)
            .orderBy('createdAt', 'desc')
            .limit(3)
            .get()
            .then(reviewSnapshot => {
              const reviews: any[] = [];
              reviewSnapshot.forEach(reviewDoc => {
                reviews.push({
                  id: reviewDoc.id,
                  ...reviewDoc.data()
                });
              });
              placeData.recentReviews = reviews;
              return placeData;
            });
          promises.push(reviewPromise);
        } else {
          places.push(placeData);
        }

        currentIndex++;
      });

      // Aguardar todas as promises de reviews se necessário
      if (promises.length > 0) {
        const placesWithReviews = await Promise.all(promises);
        places.push(...placesWithReviews);
      }

      // Ordenar por distância se não há outros critérios
      if (!filters.sortBy || filters.sortBy === 'distance') {
        places.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      } else if (filters.sortBy === 'rating') {
        places.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      } else if (filters.sortBy === 'newest') {
        places.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      }

      logger.info(`Encontrados ${places.length} lugares no mapa`);

      return {
        success: true,
        places,
        total: places.length,
        hasMore: places.length === pagination.limit,
        center,
        radius,
        appliedFilters: filters
      };

    } catch (error) {
      logger.error('Erro ao buscar lugares no mapa:', error);
      throw new HttpsError('internal', 'Erro interno do servidor');
    }
  }
);

/**
 * Função para filtros avançados de lugares
 * @param data.filters - Objeto com filtros complexos
 * @param data.location - Localização de referência (opcional)
 * @param data.pagination - Controle de paginação
 */
export const searchPlacesAdvanced = onCall(
  { region: 'us-central1' },
  async (request) => {
    const {
      filters = {},
      location,
      pagination = { limit: 20, offset: 0 },
      sortBy = 'relevance'
    } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    try {
      logger.info(`Busca avançada de lugares para usuário ${userId}`, {
        filters,
        location,
        pagination,
        sortBy
      });

      // Verificar se usuário está ativo
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists || !userDoc.data()?.isActive) {
        throw new HttpsError('permission-denied', 'Usuário não encontrado ou inativo');
      }

      // Primeiro, vamos buscar todos os lugares ativos para debug
      const allPlacesSnapshot = await db.collection('places').get();
      logger.info(`Total de documentos na coleção places: ${allPlacesSnapshot.size}`);

      // Verificar quantos têm isActive = true
      let activePlacesCount = 0;
      let placesWithSearchKeywords = 0;
      allPlacesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.isActive === true) {
          activePlacesCount++;
        }
        if (data.searchKeywords && Array.isArray(data.searchKeywords)) {
          placesWithSearchKeywords++;
          logger.info(`Place ${doc.id} tem searchKeywords: ${data.searchKeywords.join(', ')}`);
        }
      });

      logger.info(`Lugares com isActive=true: ${activePlacesCount}`);
      logger.info(`Lugares com searchKeywords: ${placesWithSearchKeywords}`);

      // Começar com uma query mais simples
      let placesQuery = db.collection('places').where('isActive', '==', true);

      // Aplicar filtros um por vez para evitar problemas de índice composto
      if (filters.searchText && filters.searchText.trim()) {
        const searchTerm = filters.searchText.toLowerCase();
        logger.info(`Aplicando filtro de texto: "${searchTerm}"`);
        placesQuery = placesQuery.where('searchKeywords', 'array-contains', searchTerm);
      }

      // Filtro por categoria (apenas se não há busca de texto para evitar índice composto)
      if (!filters.searchText && filters.categories && filters.categories.length > 0) {
        logger.info(`Aplicando filtro de categoria: ${filters.categories}`);
        placesQuery = placesQuery.where('category', 'in', filters.categories);
      }

      // Filtro por avaliação mínima (apenas se não há outros filtros)
      if (!filters.searchText && !filters.categories && filters.minRating && filters.minRating > 0) {
        logger.info(`Aplicando filtro de rating mínimo: ${filters.minRating}`);
        placesQuery = placesQuery.where('averageRatings.overall', '>=', filters.minRating);
      }

      // Filtro por preço (se disponível)
      if (filters.priceRange && filters.priceRange.length === 2) {
        const [minPrice, maxPrice] = filters.priceRange;
        if (minPrice > 0) {
          placesQuery = placesQuery.where('averagePrice', '>=', minPrice);
        }
        if (maxPrice > 0) {
          placesQuery = placesQuery.where('averagePrice', '<=', maxPrice);
        }
      }

      // Filtro por horário de funcionamento
      if (filters.openNow) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 = domingo

        placesQuery = placesQuery.where('isOpen24h', '==', true);
        // Ou implementar lógica mais complexa de horários
      }

      // Aplicar ordenação
      if (sortBy === 'rating') {
        placesQuery = placesQuery.orderBy('averageRatings.overall', 'desc');
      } else if (sortBy === 'newest') {
        placesQuery = placesQuery.orderBy('createdAt', 'desc');
      } else if (sortBy === 'alphabetical') {
        placesQuery = placesQuery.orderBy('name', 'asc');
      } else if (sortBy === 'reviewCount') {
        placesQuery = placesQuery.orderBy('averageRatings.totalReviews', 'desc');
      }

      // Aplicar paginação
      if (pagination.offset > 0) {
        placesQuery = placesQuery.offset(pagination.offset);
      }
      placesQuery = placesQuery.limit(pagination.limit);

      const snapshot = await placesQuery.get();
      const places: any[] = [];

      // Se há localização, calcular distâncias manualmente
      const promises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let placeData: any = {
          id: doc.id,
          ...data
        };

        // Calcular distância se localização fornecida
        if (location?.lat && location?.lng && data.coordinates) {
          const distance = calculateDistance(
            location.lat,
            location.lng,
            data.coordinates.latitude,
            data.coordinates.longitude
          );
          placeData.distance = distance;
        }

        // Aplicar filtro de distância máxima se especificado
        if (filters.maxDistance && placeData.distance && placeData.distance > filters.maxDistance) {
          return null; // Não incluir este lugar
        }

        // Filtro por tags
        if (filters.tags && filters.tags.length > 0) {
          const placeTags = data.tags || [];
          const hasMatchingTag = filters.tags.some((tag: string) =>
            placeTags.includes(tag)
          );
          if (!hasMatchingTag) {
            return null;
          }
        }

        // Buscar dados extras se solicitado
        if (filters.includeReviews) {
          const reviewsSnapshot = await db.collection('reviews')
            .where('placeId', '==', doc.id)
            .orderBy('createdAt', 'desc')
            .limit(3)
            .get();

          const reviews: any[] = [];
          reviewsSnapshot.forEach(reviewDoc => {
            reviews.push({
              id: reviewDoc.id,
              ...reviewDoc.data()
            });
          });
          placeData.recentReviews = reviews;
        }

        return placeData;
      });

      const results = await Promise.all(promises);
      const validPlaces = results.filter(place => place !== null);

      // Ordenar por distância se location foi fornecida e sortBy é distance
      if (location && sortBy === 'distance') {
        validPlaces.sort((a: any, b: any) => (a.distance || Infinity) - (b.distance || Infinity));
      }

      logger.info(`Busca avançada retornou ${validPlaces.length} lugares`);

      return {
        success: true,
        places: validPlaces,
        total: validPlaces.length,
        hasMore: validPlaces.length === pagination.limit,
        appliedFilters: filters,
        sortBy
      };

    } catch (error) {
      logger.error('Erro na busca avançada:', error);
      throw new HttpsError('internal', 'Erro interno do servidor');
    }
  }
);

/**
 * Salvar/atualizar localização do usuário para futuras consultas
 * @param data.location - { lat, lng, accuracy?, timestamp? }
 * @param data.address - Endereço legível (opcional)
 */
export const updateUserLocation = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { location, address } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    if (!location?.lat || !location?.lng) {
      throw new HttpsError('invalid-argument', 'Coordenadas de localização são obrigatórias');
    }

    try {
      // Verificar se usuário está ativo
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists || !userDoc.data()?.isActive) {
        throw new HttpsError('permission-denied', 'Usuário não encontrado ou inativo');
      }

      const locationData = {
        coordinates: new GeoPoint(location.lat, location.lng),
        accuracy: location.accuracy || null,
        address: address || null,
        timestamp: new Date(),
        updatedAt: new Date()
      };

      await db.collection('users').doc(userId).update({
        currentLocation: locationData,
        lastLocationUpdate: new Date()
      });

      logger.info(`Localização atualizada para usuário ${userId}`, {
        coordinates: [location.lat, location.lng],
        address,
        accuracy: location.accuracy
      });

      return {
        success: true,
        message: 'Localização atualizada com sucesso',
        location: locationData
      };

    } catch (error) {
      logger.error('Erro ao atualizar localização:', error);
      throw new HttpsError('internal', 'Erro interno do servidor');
    }
  }
);

/**
 * Obter localização salva do usuário
 */
export const getUserLocation = onCall(
  { region: 'us-central1' },
  async (request) => {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    try {
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists || !userDoc.data()?.isActive) {
        throw new HttpsError('permission-denied', 'Usuário não encontrado ou inativo');
      }

      const userData = userDoc.data();
      const currentLocation = userData?.currentLocation;

      if (!currentLocation) {
        return {
          success: true,
          hasLocation: false,
          message: 'Nenhuma localização salva encontrada'
        };
      }

      // Verificar se a localização não está muito antiga (ex: mais de 24h)
      const locationAge = Date.now() - currentLocation.timestamp.toMillis();
      const isStale = locationAge > (24 * 60 * 60 * 1000); // 24 horas

      return {
        success: true,
        hasLocation: true,
        location: {
          lat: currentLocation.coordinates.latitude,
          lng: currentLocation.coordinates.longitude,
          accuracy: currentLocation.accuracy,
          address: currentLocation.address,
          timestamp: currentLocation.timestamp,
          isStale
        },
        lastUpdate: userData.lastLocationUpdate
      };

    } catch (error) {
      logger.error('Erro ao obter localização do usuário:', error);
      throw new HttpsError('internal', 'Erro interno do servidor');
    }
  }
);

/**
 * Obter detalhes completos de um lugar usando Place ID
 * Implementa cache inteligente: busca no Firebase primeiro, depois Google API se necessário
 * @param data.placeId - Google Place ID obrigatório
 * @param data.forceRefresh - Forçar busca na API mesmo com dados em cache (opcional)
 * @param data.language - Idioma para dados localizados (default: 'pt-BR')
 */
// ...existing code...

export const getPlaceDetails = onCall(
  { region: 'us-central1' },
  async (request) => {
    const {
      placeId,
      forceRefresh = false,
      language = 'pt-BR'
    } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    if (!placeId) {
      throw new HttpsError('invalid-argument', 'Place ID é obrigatório');
    }

    try {
      logger.info(`Buscando detalhes do lugar ${placeId} para usuário ${userId}`, {
        placeId,
        forceRefresh,
        language
      });

      // Verificar se usuário está ativo
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists || !userDoc.data()?.isActive) {
        throw new HttpsError('permission-denied', 'Usuário não encontrado ou inativo');
      }

      let placeData = null;
      let fromCache = false;

      // 1. Tentar buscar no cache primeiro (se não forçar refresh)
      if (!forceRefresh) {
        const cachedPlaceDoc = await db.collection('places').doc(placeId).get();

        if (cachedPlaceDoc.exists) {
          const cachedData = cachedPlaceDoc.data();
          const lastSync = cachedData?.lastGoogleSync;

          // Verificar se dados não estão muito antigos (7 dias)
          const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms
          const isDataFresh = lastSync &&
            (Date.now() - lastSync.toMillis()) < CACHE_DURATION;

          if (isDataFresh) {
            logger.info(`Dados encontrados no cache para lugar ${placeId}`);
            placeData = cachedData;
            fromCache = true;
          } else {
            logger.info(`Dados em cache expirados para lugar ${placeId}, buscando API`);
          }
        } else {
          logger.info(`Lugar ${placeId} não encontrado no cache, buscando API`);
        }
      }

      // 2. Buscar na Google Places API se necessário
      if (!placeData) {
        try {
          // Simulação da chamada à Google Places API
          // Em produção, substituir por chamada real à API
          const googleResponse = await fetchGooglePlaceDetails(placeId, language);

          if (!googleResponse) {
            throw new HttpsError('not-found', 'Lugar não encontrado na API do Google');
          }

          // Processar dados da API do Google
          const processedData = processGooglePlaceData(googleResponse, placeId);

          // 3. Salvar no Firestore e GeoFirestore
          await saveOrUpdatePlace(processedData);

          placeData = processedData;
          fromCache = false;

          logger.info(`Dados obtidos da API e salvos para lugar ${placeId}`);

        } catch (apiError: any) {
          logger.error(`Erro ao buscar lugar ${placeId} na API:`, apiError);

          // Se a API falhar, tentar usar dados antigos se existirem
          const fallbackDoc = await db.collection('places').doc(placeId).get();
          if (fallbackDoc.exists) {
            logger.info(`Usando dados antigos como fallback para lugar ${placeId}`);
            placeData = fallbackDoc.data();
            fromCache = true;
          } else {
            throw new HttpsError('unavailable', 'Serviço temporariamente indisponível');
          }
        }
      }

      // 4. Preparar resposta base (mantém compatibilidade)
      const response: any = {
        success: true,
        place: {
          id: placeId,
          ...placeData
        },
        fromCache,
        _meta: {
          fromCache,
          lastUpdate: placeData?.lastGoogleSync || placeData?.updatedAt,
          language
        }
      };

      // 5. SE usuário autenticado, adicionar dados específicos do usuário
      if (userId) {
        
        // 5a. Buscar listas do usuário que contêm este lugar
        const listPlacesSnapshot = await db.collection('listPlaces')
          .where('placeId', '==', placeId)
          .get();

        const userLists: any[] = [];

        if (!listPlacesSnapshot.empty) {
          const listIds = listPlacesSnapshot.docs.map(doc => doc.data().listId);
          
          // Buscar apenas listas que pertencem ao usuário (máximo 10 por limitação do Firestore)
          if (listIds.length > 0) {
            const chunks = [];
            for (let i = 0; i < listIds.length; i += 10) {
              chunks.push(listIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
              const userListsSnapshot = await db.collection('lists')
                .where('ownerId', '==', userId)
                .where(FieldPath.documentId(), 'in', chunk)
                .get();

              const chunkLists = userListsSnapshot.docs.map(listDoc => {
                const listData = listDoc.data();
                const listPlaceDoc = listPlacesSnapshot.docs.find(
                  lpDoc => lpDoc.data().listId === listDoc.id
                );
                const listPlaceData = listPlaceDoc?.data();

                return {
                  id: listDoc.id,
                  title: listData.title,
                  emoji: listData.emoji || '📍',
                  visibility: listData.visibility || 'private',
                  addedAt: listPlaceData?.addedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                  personalNote: listPlaceData?.personalNote || '',
                  tags: listPlaceData?.tags || [],
                  priority: listPlaceData?.priority || 0
                };
              });

              userLists.push(...chunkLists);
            }
          }
        }

        // 5b. Buscar interação do usuário com o lugar
        const userInteractionDoc = await db.collection('userPlaceInteractions')
          .doc(`${userId}_${placeId}`)
          .get();

        let userInteraction = null;
        if (userInteractionDoc.exists) {
          const data = userInteractionDoc.data()!;
          userInteraction = {
            userId: data.userId,
            placeId: data.placeId,
            isVisited: data.isVisited || false,
            isFavorite: data.isFavorite || false,
            isWantToVisit: data.isWantToVisit || false,
            totalReviews: data.totalReviews || 0,
            lastInteractionAt: data.lastInteractionAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          };
        }

        // 5c. Buscar reviews mais recentes do lugar (máximo 15)
        const reviewsSnapshot = await db.collection('reviews')
          .where('placeId', '==', placeId)
          .orderBy('createdAt', 'desc')
          .limit(15)
          .get();

        const placeReviews: any[] = [];        

        // Buscar dados dos usuários que fizeram reviews
        const userIds = reviewsSnapshot.docs.map(doc => doc.data().userId);
        const uniqueUserIds = [...new Set(userIds)];
        
        const userDataMap: { [key: string]: any } = {};
        
        // Buscar dados dos usuários em lotes (máximo 10 por vez devido ao limite do Firestore)
        for (let i = 0; i < uniqueUserIds.length; i += 10) {
          const userIdsBatch = uniqueUserIds.slice(i, i + 10);
          const usersSnapshot = await db.collection('users')
            .where(FieldPath.documentId(), 'in', userIdsBatch)
            .get();
          
          usersSnapshot.forEach(userDoc => {
            const userData = userDoc.data();
            userDataMap[userDoc.id] = {
              name: userData.name || userData.displayName || 'Usuário',
              photoURL: userData.photoURL || userData.profileImage || null
            };
          });
        }

        reviewsSnapshot.forEach(reviewDoc => {
          const reviewData = reviewDoc.data();
          const userData = userDataMap[reviewData.userId] || { name: 'Usuário', photoURL: null };
          
          const review = {
            id: reviewDoc.id,
            userId: reviewData.userId,
            userName: userData.name,
            userPhoto: userData.photoURL,
            rating: reviewData.rating,
            reviewType: reviewData.reviewType,
            comment: reviewData.comment,
            wouldReturn: reviewData.wouldReturn,
            isVisited: reviewData.isVisited,
            photos: reviewData.photos || [],
            tags: reviewData.tags || [],
            visitDate: reviewData.visitDate?.toDate?.()?.toISOString() || null,
            createdAt: reviewData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: reviewData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          };

          placeReviews.push(review);          
        });

        // Adicionar campos opcionais apenas se usuário autenticado
        response.userLists = userLists;
        response.userInteraction = userInteraction;
        response.reviews = placeReviews;
      }

      // 6. Registrar que o usuário acessou este lugar (para analytics)
      await recordPlaceAccess(userId, placeId);

      logger.info(`Detalhes retornados para lugar ${placeId}`, {
        fromCache,
        hasCoordinates: !!placeData?.coordinates,
        hasGoogleData: !!placeData?.googleData,
        userListsCount: response.userLists?.length || 0,
        hasUserInteraction: !!response.userInteraction,
        hasUserReview: !!response.userReview
      });

      return response;

    } catch (error) {
      logger.error(`Erro ao obter detalhes do lugar ${placeId}:`, error);

      // Re-throw HttpsError as-is, convert others to internal error
      if (error instanceof HttpsError) {
        throw error;
      } else {
        throw new HttpsError('internal', 'Erro interno do servidor');
      }
    }
  }
);

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
