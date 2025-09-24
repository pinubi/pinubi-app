/**
 * FEED FUNCTIONS - PINUBI FUNCTIONS
 * 
 * Sistema de feed personalizado para mostrar atividades relevantes dos usuários.
 * Inclui algoritmo de relevância, cache inteligente e feeds geográficos.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { db } from '../config/firebase';
import { rateLimiter, serverTimestamp } from '../utils/helpers';
import { GeoFirestore } from 'geofirestore';
import * as admin from 'firebase-admin';

// Inicializar GeoFirestore para consultas geográficas
const geoFirestore = new GeoFirestore(db);

// ======================
// TIPOS E INTERFACES
// ======================

interface FeedItem {
  id: string;
  userId: string;
  authorId: string;
  authorName: string;
  type: 'place_added' | 'place_visited' | 'place_reviewed' | 'list_created' | 'list_purchased' | 'list_monetized' | 'user_followed';
  data: any;
  activityId: string;
  relevanceScore: number;
  distance?: number; // em km
  isFollowing: boolean;
  createdAt: any;
}

interface FeedQuery {
  userId: string;
  limit?: number;
  lastTimestamp?: any;
  types?: string[];
  friendsOnly?: boolean;
  maxDistance?: number; // em km
  includeGeographic?: boolean;
}

interface RelevanceFactors {
  socialProximity: number; // 0-10
  geographicProximity: number; // 0-10
  categoryMatch: number; // 0-10
  recency: number; // 0-10
  engagement: number; // 0-10
}

// ======================
// FUNÇÕES AUXILIARES
// ======================

/**
 * Calcula score de relevância para um item do feed
 */
function calculateRelevanceScore(
  activity: any,
  currentUser: any,
  factors: RelevanceFactors
): number {
  const weights = {
    social: 0.3,
    geographic: 0.2,
    category: 0.2,
    recency: 0.2,
    engagement: 0.1
  };

  return (
    factors.socialProximity * weights.social +
    factors.geographicProximity * weights.geographic +
    factors.categoryMatch * weights.category +
    factors.recency * weights.recency +
    factors.engagement * weights.engagement
  );
}

/**
 * Calcula proximidade social entre usuários
 */
function calculateSocialProximity(
  authorId: string,
  currentUserId: string,
  following: string[],
  followers: string[]
): number {
  if (authorId === currentUserId) return 0; // Não mostrar próprias atividades

  // Usuário que o current user segue = máxima relevância
  if (following.includes(authorId)) return 10;

  // Usuário que segue o current user = alta relevância
  if (followers.includes(authorId)) return 7;

  // Amigos mútuos = média relevância
  // (pode ser implementado em versão futura)

  // Usuários da mesma região = baixa relevância
  return 3;
}

/**
 * Calcula proximidade geográfica
 */
function calculateGeographicProximity(
  placeCoords: { lat: number; lng: number },
  userCoords: { lat: number; lng: number }
): { score: number; distance: number } {
  if (!placeCoords || !userCoords) return { score: 0, distance: 999999 };

  // Calcular distância usando fórmula haversine
  const distance = calculateDistance(
    placeCoords.lat, placeCoords.lng,
    userCoords.lat, userCoords.lng
  );

  let score = 0;
  if (distance <= 1) score = 10;      // Muito próximo (1km)
  else if (distance <= 5) score = 8;  // Próximo (5km)
  else if (distance <= 15) score = 6; // Mesma cidade (15km)
  else if (distance <= 50) score = 4; // Região metropolitana (50km)
  else if (distance <= 200) score = 2; // Mesmo estado (200km)
  else score = 0;                     // Muito longe

  return { score, distance };
}

/**
 * Fórmula Haversine para calcular distância entre coordenadas
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calcula match de categoria baseado nas preferências do usuário
 */
function calculateCategoryMatch(
  activityData: any,
  userPreferences: any
): number {
  if (!userPreferences?.categories || !activityData) return 5; // Neutro

  const userCategories = userPreferences.categories || [];
  const placeCategories = activityData.placeCategories || activityData.categories || [];

  if (placeCategories.length === 0) return 5;

  // Verificar intersection entre categorias
  const matches = placeCategories.filter((cat: string) => 
    userCategories.includes(cat)
  ).length;

  const score = Math.min(10, (matches / userCategories.length) * 10);
  return score;
}

/**
 * Calcula recência (quanto mais recente, maior o score)
 */
function calculateRecency(createdAt: any): number {
  const now = Date.now();
  const activityTime = createdAt?.toMillis ? createdAt.toMillis() : new Date(createdAt).getTime();
  const ageInHours = (now - activityTime) / (1000 * 60 * 60);

  if (ageInHours <= 2) return 10;      // Muito recente (2h)
  else if (ageInHours <= 12) return 8; // Recente (12h)
  else if (ageInHours <= 24) return 6; // 1 dia
  else if (ageInHours <= 72) return 4; // 3 dias
  else if (ageInHours <= 168) return 2; // 1 semana
  else return 1; // Mais antigo
}

/**
 * Calcula engajamento baseado na atividade
 */
function calculateEngagement(activityData: any): number {
  let score = 5; // Base neutro

  // Reviews com notas altas têm mais relevância
  if (activityData.rating) {
    score += (activityData.rating / 10) * 3; // +3 para rating 10
  }

  // Listas com muitos places têm mais relevância
  if (activityData.placesCount) {
    score += Math.min(2, activityData.placesCount / 10); // +2 para 10+ places
  }

  // Atividades com fotos têm mais relevância
  if (activityData.photos && activityData.photos.length > 0) {
    score += 1;
  }

  return Math.min(10, score);
}

// ======================
// TRIGGERS PARA CACHE
// ======================

/**
 * Trigger: Nova atividade criada - distribuir para feeds relevantes
 */
export const onActivityCreated = onDocumentCreated('activities/{activityId}', async (event) => {
  const activityData = event.data?.data();
  const activityId = event.params.activityId;

  if (!activityData || !activityData.isPublic) return;

  logger.info(`Distribuindo atividade ${activityId} para feeds relevantes`);

  try {
    // Buscar dados do autor da atividade
    const authorDoc = await db.collection('users').doc(activityData.userId).get();
    const authorData = authorDoc.data();

    if (!authorData || !authorData.isActive) return;

    // Buscar seguidores do autor
    const followersSnapshot = await db.collection('follows')
      .where('followingId', '==', activityData.userId)
      .where('status', '==', 'active')
      .get();

    const batch = db.batch();
    let batchCount = 0;

    // Adicionar a atividade ao feed do próprio autor
    const authorFeedItemRef = db.collection('userFeeds').doc(activityData.userId)
      .collection('items').doc(`${activityId}_self_${Date.now()}`);

    batch.set(authorFeedItemRef, {
      activityId,
      authorId: activityData.userId,
      authorName: authorData.displayName || 'Usuário',
      type: activityData.type,
      data: activityData.data,
      relevanceScore: 10, // Alta relevância para próprias atividades
      isFollowing: false, // Não está "seguindo" a si mesmo
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 dias
    });

    batchCount++;

    // Distribuir para seguidores
    for (const followerDoc of followersSnapshot.docs) {
      const followerId = followerDoc.data().followerId;

      // Buscar dados do seguidor para calcular relevância
      const followerData = await db.collection('users').doc(followerId).get();
      if (!followerData.exists || !followerData.data()?.isActive) continue;

      const relevanceScore = await calculateActivityRelevance(
        activityData,
        authorData,
        followerData.data()!
      );

      // Só adicionar ao feed se relevância >= 5
      if (relevanceScore >= 5) {
        const feedItemRef = db.collection('userFeeds').doc(followerId)
          .collection('items').doc(`${activityId}_${Date.now()}`);

        batch.set(feedItemRef, {
          activityId,
          authorId: activityData.userId,
          authorName: authorData.displayName || 'Usuário',
          type: activityData.type,
          data: activityData.data,
          relevanceScore,
          isFollowing: true,
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 dias
        });

        batchCount++;

        // Firebase tem limite de 500 operations per batch
        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    logger.info(`Atividade ${activityId} distribuída para ${batchCount} feeds`);

  } catch (error) {
    logger.error(`Erro ao distribuir atividade ${activityId}:`, error);
  }
});

/**
 * Calcula relevância de uma atividade para um usuário específico
 */
async function calculateActivityRelevance(
  activity: any,
  author: any,
  targetUser: any
): Promise<number> {
  const factors: RelevanceFactors = {
    socialProximity: calculateSocialProximity(
      author.id,
      targetUser.id,
      targetUser.following || [],
      targetUser.followers || []
    ),
    geographicProximity: 5, // Default
    categoryMatch: calculateCategoryMatch(activity.data, targetUser.preferences),
    recency: calculateRecency(activity.createdAt),
    engagement: calculateEngagement(activity.data)
  };

  // Calcular proximidade geográfica se há dados de lugar
  if (activity.data?.placeCoordinates && targetUser.location?.coordinates) {
    const geoProximity = calculateGeographicProximity(
      activity.data.placeCoordinates,
      targetUser.location.coordinates
    );
    factors.geographicProximity = geoProximity.score;
  }

  return calculateRelevanceScore(activity, targetUser, factors);
}

// ======================
// FUNCTIONS CALLABLE
// ======================

/**
 * Buscar feed personalizado do usuário
 */
export const getUserFeed = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const userId = request.auth.uid;
    const {
      limit = 20,
      lastTimestamp,
      types,
      friendsOnly = false,
      maxDistance = 50,
      includeGeographic = true
    }: FeedQuery = request.data;

    // Rate limiting
    if (!rateLimiter.isAllowed(`get_feed_${userId}`, 100, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    // Buscar dados do usuário
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado');
    }

    const userData = userDoc.data()!;

    // 1. Buscar feed cached (para seguidos)
    let feedQuery = db.collection('userFeeds').doc(userId)
      .collection('items')
      .where('expiresAt', '>', new Date())
      .orderBy('expiresAt')
      .orderBy('relevanceScore', 'desc')
      .limit(limit);

    if (lastTimestamp) {
      feedQuery = feedQuery.startAfter(lastTimestamp);
    }

    if (types && types.length > 0) {
      feedQuery = feedQuery.where('type', 'in', types);
    }

    const cachedFeedSnapshot = await feedQuery.get();
    let feedItems: FeedItem[] = [];

    // Processar itens cached
    for (const doc of cachedFeedSnapshot.docs) {
      const data = doc.data();
      feedItems.push({
        id: doc.id,
        userId: userId,
        authorId: data.authorId,
        authorName: data.authorName,
        type: data.type,
        data: data.data,
        activityId: data.activityId,
        relevanceScore: data.relevanceScore,
        isFollowing: data.isFollowing,
        createdAt: data.createdAt
      });
    }

    // 2. Se não tem suficientes items E includeGeographic = true, buscar feed geográfico
    if (feedItems.length < limit && includeGeographic && userData.location?.coordinates) {
      const geographicItems = await getGeographicFeed(
        userId,
        userData,
        limit - feedItems.length,
        maxDistance
      );
      feedItems.push(...geographicItems);
    }

    // 3. Ordenar por relevância e recência
    feedItems.sort((a, b) => {
      const scoreA = a.relevanceScore + calculateRecency(a.createdAt);
      const scoreB = b.relevanceScore + calculateRecency(b.createdAt);
      return scoreB - scoreA;
    });

    // 4. Limitar resultado final
    feedItems = feedItems.slice(0, limit);

    return {
      success: true,
      items: feedItems,
      hasMore: feedItems.length === limit,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Erro ao buscar feed:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Buscar feed geográfico (lugares próximos)
 */
async function getGeographicFeed(
  userId: string,
  userData: any,
  limit: number,
  maxDistance: number
): Promise<FeedItem[]> {
  try {
    const userCoords = userData.location.coordinates;
    const center = new admin.firestore.GeoPoint(userCoords.lat, userCoords.lng);

    // Buscar atividades próximas geograficamente
    const activitiesSnapshot = await db.collection('activities')
      .where('isPublic', '==', true)
      .where('type', 'in', ['place_added', 'place_visited', 'place_reviewed'])
      .orderBy('createdAt', 'desc')
      .limit(limit * 3) // Buscar mais para filtrar depois
      .get();

    const geographicItems: FeedItem[] = [];

    for (const activityDoc of activitiesSnapshot.docs) {
      if (geographicItems.length >= limit) break;

      const activity = activityDoc.data();
      
      // Pular atividades do próprio usuário
      if (activity.userId === userId) continue;

      // Verificar se tem coordenadas do lugar
      if (!activity.data?.placeCoordinates) continue;

      // Calcular distância
      const geoProximity = calculateGeographicProximity(
        activity.data.placeCoordinates,
        userCoords
      );

      // Só incluir se dentro do raio
      if (geoProximity.distance <= maxDistance) {
        // Buscar dados do autor
        const authorDoc = await db.collection('users').doc(activity.userId).get();
        const authorData = authorDoc.data();

        if (!authorData || !authorData.isActive) continue;

        const relevanceScore = await calculateActivityRelevance(activity, authorData, userData);

        geographicItems.push({
          id: `geo_${activityDoc.id}`,
          userId: userId,
          authorId: activity.userId,
          authorName: authorData.displayName || 'Usuário',
          type: activity.type,
          data: activity.data,
          activityId: activityDoc.id,
          relevanceScore,
          distance: geoProximity.distance,
          isFollowing: false,
          createdAt: activity.createdAt
        });
      }
    }

    return geographicItems;

  } catch (error) {
    logger.error('Erro ao buscar feed geográfico:', error);
    return [];
  }
}

/**
 * Refresh manual do feed do usuário
 */
export const refreshUserFeed = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const userId = request.auth.uid;

    // Rate limiting mais restritivo para refresh
    if (!rateLimiter.isAllowed(`refresh_feed_${userId}`, 10, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas de refresh. Tente novamente mais tarde.');
    }

    // Limpar feed cached antigo
    const oldFeedSnapshot = await db.collection('userFeeds').doc(userId)
      .collection('items')
      .where('expiresAt', '<', new Date())
      .get();

    const batch = db.batch();
    oldFeedSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    logger.info(`Feed refreshed para usuário ${userId}`);

    return {
      success: true,
      message: 'Feed atualizado com sucesso'
    };

  } catch (error) {
    logger.error('Erro ao fazer refresh do feed:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Buscar feed de descoberta (lugares trending na região)
 */
export const getDiscoveryFeed = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const userId = request.auth.uid;
    const { limit = 20, maxDistance = 25 } = request.data;

    // Rate limiting
    if (!rateLimiter.isAllowed(`discovery_feed_${userId}`, 50, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    // Buscar dados do usuário
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado');
    }

    const userData = userDoc.data()!;

    if (!userData.location?.coordinates) {
      throw new HttpsError('failed-precondition', 'Localização do usuário necessária para descoberta');
    }

    // Buscar lugares com mais atividade recente na região
    const last7Days = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

    const trendingActivitiesSnapshot = await db.collection('activities')
      .where('isPublic', '==', true)
      .where('type', 'in', ['place_reviewed', 'place_visited'])
      .where('createdAt', '>=', last7Days)
      .orderBy('createdAt', 'desc')
      .limit(limit * 5)
      .get();

    const placeActivityCount: { [placeId: string]: number } = {};
    const placeData: { [placeId: string]: any } = {};

    // Contar atividades por lugar e filtrar por distância
    for (const activityDoc of trendingActivitiesSnapshot.docs) {
      const activity = activityDoc.data();
      
      if (!activity.data?.placeId || !activity.data?.placeCoordinates) continue;

      // Verificar distância
      const geoProximity = calculateGeographicProximity(
        activity.data.placeCoordinates,
        userData.location.coordinates
      );

      if (geoProximity.distance <= maxDistance) {
        const placeId = activity.data.placeId;
        placeActivityCount[placeId] = (placeActivityCount[placeId] || 0) + 1;
        
        if (!placeData[placeId]) {
          placeData[placeId] = {
            ...activity.data,
            distance: geoProximity.distance,
            activityCount: 0
          };
        }
      }
    }

    // Ordenar lugares por popularidade
    const trendingPlaces = Object.keys(placeActivityCount)
      .map(placeId => ({
        placeId,
        activityCount: placeActivityCount[placeId],
        ...placeData[placeId]
      }))
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, limit);

    return {
      success: true,
      trendingPlaces,
      region: `${userData.location.city}, ${userData.location.state}`,
      radius: maxDistance
    };

  } catch (error) {
    logger.error('Erro ao buscar feed de descoberta:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});
