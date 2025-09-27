import { PlaceEntity } from '@pinubi/types';
import { GeoPoint } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { GeoFirestoreTypes } from 'geofirestore';
import { db, geofirestore } from '../config/firebase';
import { fetchGooglePlaceDetails } from '../utils/fetch';

/*
 * onCall
 */

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

      const places: PlaceEntity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as GeoFirestoreTypes.GeoDocumentData & PlaceEntity;
        
        places.push({
          id: doc.id,
          googleData: data.googleData,
          totalReviews: data.totalReviews || 0,
          distance: data.distance || doc.distance || 0,
          averageRating: data.averageRating || 0,
          totalRatings: data.totalRatings || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
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
 * Buscar detalhes de um lugar usando Place ID
 * @param data.placeId - Google Place ID obrigatório
 * @param data.forceRefresh - Forçar busca na API mesmo com dados em cache (opcional)
 * @param data.language - Idioma para dados localizados (default: 'pt-BR')
 */
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
          const cachedData = cachedPlaceDoc.data() as PlaceEntity;
          const lastSync = new Date(cachedData.updatedAt);

          // Verificar se dados não estão muito antigos (7 dias)
          const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms
          const isDataFresh = lastSync &&
            (Date.now() - lastSync.getTime()) < CACHE_DURATION;

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



/*
 * Triggers
 */
