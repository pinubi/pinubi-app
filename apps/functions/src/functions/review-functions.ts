import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { db, admin, storage } from '../config/firebase';
import { rateLimiter, serverTimestamp, incrementField, processReviewPhotos, cleanDataForFirestore } from '../utils/helpers';

// ======================
// TIPOS E INTERFACES
// ======================

interface ReviewPhotoInput {
  base64: string;
  fileName: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

interface ReviewData {
  placeId: string;
  rating: number; // 0-10 com decimais
  reviewType: 'food' | 'drink' | 'dessert' | 'service' | 'ambiance' | 'overall';
  wouldReturn: boolean;
  comment?: string;
  photos?: string[];
  isVisited: boolean;
  visitDate?: string;
}

interface ReviewDataInput {
  placeId: string;
  rating: number; // 0-10 com decimais
  reviewType: 'food' | 'drink' | 'dessert' | 'service' | 'ambiance' | 'overall';
  wouldReturn: boolean;
  comment?: string;
  photos?: ReviewPhotoInput[];
  isVisited: boolean;
  visitDate?: string;
}

interface PhotoData {
  url: string;
  thumbnail?: string;
  size: number;
  width: number;
  height: number;
}

interface PlaceAverageRatings {
  overall: number;
  food?: number;
  drink?: number;
  dessert?: number;
  service?: number;
  ambiance?: number;
  totalReviews: number;
}

// ======================
// FUNÇÕES AUXILIARES
// ======================

/**
 * Cria atividade de review
 */
async function createReviewActivity(
  userId: string,
  reviewData: ReviewData,
  batch?: admin.firestore.WriteBatch
): Promise<void> {
  const activityRef = db.collection('activities').doc();
  const activityData = {
    id: activityRef.id,
    userId,
    type: 'place_reviewed',
    data: {
      placeId: reviewData.placeId,
      rating: reviewData.rating,
      reviewType: reviewData.reviewType,
      wouldReturn: reviewData.wouldReturn,
      comment: reviewData.comment,
      photos: reviewData.photos
    },
    isPublic: true,
    createdAt: serverTimestamp()
  };

  if (batch) {
    batch.set(activityRef, activityData);
  } else {
    await activityRef.set(activityData);
  }
}

/**
 * Cria atividade quando lugar é visitado
 */
async function createPlaceVisitedActivity(
  userId: string,
  reviewData: ReviewData,
  batch?: admin.firestore.WriteBatch
): Promise<void> {
  const activityRef = db.collection('activities').doc();
  const activityData = {
    id: activityRef.id,
    userId,
    type: 'place_visited',
    data: {
      placeId: reviewData.placeId,
      visitDate: reviewData.visitDate,
      // Buscar dados do lugar para enriquecer a atividade
      // (implementar busca do place se necessário)
    },
    isPublic: true,
    createdAt: serverTimestamp()
  };

  if (batch) {
    batch.set(activityRef, activityData);
  } else {
    await activityRef.set(activityData);
  }
}

/**
 * Valida dados de review
 */
function validateReviewData(data: any): { isValid: boolean; error?: string } {
  if (!data.placeId) {
    return { isValid: false, error: 'placeId é obrigatório' };
  }

  if (typeof data.rating !== 'number' || data.rating < 0 || data.rating > 10) {
    return { isValid: false, error: 'rating deve ser um número entre 0 e 10' };
  }

  const validTypes = ['food', 'drink', 'dessert', 'service', 'ambiance', 'overall'];
  if (!data.reviewType || !validTypes.includes(data.reviewType)) {
    return { isValid: false, error: 'reviewType deve ser um dos tipos válidos' };
  }

  if (typeof data.wouldReturn !== 'boolean') {
    return { isValid: false, error: 'wouldReturn deve ser boolean' };
  }

  if (typeof data.isVisited !== 'boolean') {
    return { isValid: false, error: 'isVisited deve ser boolean' };
  }

  return { isValid: true };
}

/**
 * Verifica se usuário já tem review do mesmo tipo para o lugar
 */
async function checkDuplicateReview(
  userId: string,
  placeId: string,
  reviewType: string,
  excludeReviewId?: string
): Promise<boolean> {
  const query = db.collection('reviews')
    .where('userId', '==', userId)
    .where('placeId', '==', placeId)
    .where('reviewType', '==', reviewType);

  const snapshot = await query.get();

  if (excludeReviewId) {
    return snapshot.docs.some(doc => doc.id !== excludeReviewId);
  }

  return !snapshot.empty;
}

/**
 * Calcula médias de um lugar
 */
async function calculatePlaceAverages(placeId: string): Promise<PlaceAverageRatings> {
  const reviewsSnapshot = await db.collection('reviews')
    .where('placeId', '==', placeId)
    .get();

  if (reviewsSnapshot.empty) {
    return {
      overall: 0,
      totalReviews: 0
    };
  }

  const reviewsByType: { [key: string]: number[] } = {};
  let allRatings: number[] = [];

  reviewsSnapshot.forEach(doc => {
    const review = doc.data();
    const type = review.reviewType;
    const rating = review.rating;

    if (!reviewsByType[type]) {
      reviewsByType[type] = [];
    }
    reviewsByType[type].push(rating);
    allRatings.push(rating);
  });

  const averages: PlaceAverageRatings = {
    overall: allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length,
    totalReviews: reviewsSnapshot.size
  };

  // Calcular médias por tipo
  Object.keys(reviewsByType).forEach(type => {
    const ratings = reviewsByType[type];
    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    (averages as any)[type] = Math.round(average * 10) / 10; // Arredondar para 1 casa decimal
  });

  // Arredondar média geral
  averages.overall = Math.round(averages.overall * 10) / 10;

  return averages;
}

/**
 * Atualiza interações do usuário com o lugar
 */
async function updateUserPlaceInteraction(
  userId: string,
  placeId: string,
  reviewData: ReviewData,
  batch?: admin.firestore.WriteBatch
): Promise<void> {
  const interactionId = `${userId}_${placeId}`;
  const interactionRef = db.collection('userPlaceInteractions').doc(interactionId);

  const existingDoc = await interactionRef.get();
  const existingData = existingDoc.data();

  // Buscar todas as reviews do usuário para este lugar
  const userReviewsSnapshot = await db.collection('reviews')
    .where('userId', '==', userId)
    .where('placeId', '==', placeId)
    .get();

  const reviews = userReviewsSnapshot.docs.map(doc => ({
    reviewId: doc.id,
    type: doc.data().reviewType,
    rating: doc.data().rating
  }));

  const personalAverage = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : reviewData.rating;

  const interactionData = {
    id: interactionId,
    userId,
    placeId,
    isVisited: reviewData.isVisited,
    isWantToVisit: existingData?.isWantToVisit || false,
    isFavorite: existingData?.isFavorite || false,
    reviews,
    personalAverage: Math.round(personalAverage * 10) / 10,
    totalReviews: reviews.length,
    lastVisit: reviewData.visitDate || serverTimestamp(),
    createdAt: existingData?.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (batch) {
    batch.set(interactionRef, interactionData, { merge: true });
  } else {
    await interactionRef.set(interactionData, { merge: true });
  }
}

// ======================
// CLOUD FUNCTIONS
// ======================

/**
 * Criar nova review
 */
export const createReview = onCall(
  { region: 'us-central1' },
  async (request) => {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    // Rate limiting
    if (!rateLimiter.isAllowed(`create_review_${userId}`, 20, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente em 1 hora.');
    }

    const reviewData = request.data as ReviewDataInput;

    // Validar dados
    const validation = validateReviewData(reviewData);
    if (!validation.isValid) {
      throw new HttpsError('invalid-argument', validation.error || 'Dados inválidos');
    }

    try {
      // Verificar se usuário já tem review do mesmo tipo para o lugar
      const hasDuplicate = await checkDuplicateReview(userId, reviewData.placeId, reviewData.reviewType);
      if (hasDuplicate) {
        throw new HttpsError('already-exists', 'Você já tem uma avaliação deste tipo para este lugar');
      }

      // Verificar se lugar existe
      const placeDoc = await db.collection('places').doc(reviewData.placeId).get();
      if (!placeDoc.exists) {
        throw new HttpsError('not-found', 'Lugar não encontrado');
      }

      // Processar upload das fotos ANTES de criar a review
      let uploadedPhotos: string[] = [];
      if (reviewData.photos && reviewData.photos.length > 0) {
        uploadedPhotos = await processReviewPhotos(reviewData.photos, userId, reviewData.placeId);
        logger.info(`${uploadedPhotos.length} fotos processadas com sucesso`);
      }

      // Criar review usando batch
      const batch = db.batch();

      const reviewRef = db.collection('reviews').doc();
      const reviewDocument = {
        id: reviewRef.id,
        userId,
        placeId: reviewData.placeId,
        rating: Math.round(reviewData.rating * 10) / 10, // Garantir 1 casa decimal
        reviewType: reviewData.reviewType,
        wouldReturn: reviewData.wouldReturn,
        comment: reviewData.comment || '',
        photos: uploadedPhotos,
        isVisited: reviewData.isVisited,
        visitDate: reviewData.visitDate ? new Date(reviewData.visitDate) : null,
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const cleanReviewDocument = cleanDataForFirestore(reviewDocument);
      batch.set(reviewRef, cleanReviewDocument);      

      // Atualizar interação do usuário com o lugar
      const processedReviewData = { ...reviewData, photos: uploadedPhotos };
      await updateUserPlaceInteraction(userId, reviewData.placeId, processedReviewData, batch);

      // Criar atividade de review
      await createReviewActivity(userId, processedReviewData, batch);

      // Criar atividade de visita se foi visitado
      if (reviewData.isVisited) {
        await createPlaceVisitedActivity(userId, processedReviewData, batch);
      }

      // Commit batch
      await batch.commit();

      logger.info(`Review criada com sucesso`, {
        reviewId: reviewRef.id,
        userId,
        placeId: reviewData.placeId,
        rating: reviewData.rating,
        type: reviewData.reviewType,
        photosCount: uploadedPhotos.length
      });

      return {
        success: true,
        reviewId: reviewRef.id,
        photos: uploadedPhotos,
        message: 'Review criada com sucesso'
      };

    } catch (error) {
      logger.error('Erro ao criar review', { error, userId, placeId: reviewData.placeId });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', 'Erro interno do servidor');
    }
  }
);

/**
 * Atualizar review existente
 */
export const updateReview = onCall(
  { region: 'us-central1' },
  async (request) => {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    // Rate limiting
    if (!rateLimiter.isAllowed(`update_review_${userId}`, 30, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente em 1 hora.');
    }

    const { reviewId, ...updateData } = request.data;

    if (!reviewId) {
      throw new HttpsError('invalid-argument', 'reviewId é obrigatório');
    }

    try {
      const reviewRef = db.collection('reviews').doc(reviewId);
      const reviewDoc = await reviewRef.get();

      if (!reviewDoc.exists) {
        throw new HttpsError('not-found', 'Review não encontrada');
      }

      const existingReview = reviewDoc.data()!;

      // Verificar se usuário é o dono da review
      if (existingReview.userId !== userId) {
        throw new HttpsError('permission-denied', 'Você não pode editar esta review');
      }

      // Validar novos dados se fornecidos
      if (updateData.rating !== undefined) {
        if (typeof updateData.rating !== 'number' || updateData.rating < 0 || updateData.rating > 10) {
          throw new HttpsError('invalid-argument', 'rating deve ser um número entre 0 e 10');
        }
      }

      // Verificar duplicata se tipo de review está mudando
      if (updateData.reviewType && updateData.reviewType !== existingReview.reviewType) {
        const hasDuplicate = await checkDuplicateReview(
          userId,
          existingReview.placeId,
          updateData.reviewType,
          reviewId
        );
        if (hasDuplicate) {
          throw new HttpsError('already-exists', 'Você já tem uma avaliação deste tipo para este lugar');
        }
      }

      // Preparar dados para atualização
      const updateFields: any = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      // Arredondar rating se fornecido
      if (updateFields.rating !== undefined) {
        updateFields.rating = Math.round(updateFields.rating * 10) / 10;
      }

      // Atualizar review
      await reviewRef.update(updateFields);

      // Se rating mudou, atualizar interações do usuário
      if (updateData.rating !== undefined || updateData.reviewType !== undefined) {
        const newReviewData = { ...existingReview, ...updateFields };
        await updateUserPlaceInteraction(userId, existingReview.placeId, newReviewData as ReviewData);
      }

      logger.info(`Review atualizada com sucesso`, {
        reviewId,
        userId,
        placeId: existingReview.placeId
      });

      return {
        success: true,
        message: 'Review atualizada com sucesso'
      };

    } catch (error) {
      logger.error('Erro ao atualizar review', { error, userId, reviewId });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', 'Erro interno do servidor');
    }
  }
);

/**
 * Deletar review
 */
export const deleteReview = onCall(
  { region: 'us-central1' },
  async (request) => {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    // Rate limiting
    if (!rateLimiter.isAllowed(`delete_review_${userId}`, 10, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente em 1 hora.');
    }

    const { reviewId } = request.data;

    if (!reviewId) {
      throw new HttpsError('invalid-argument', 'reviewId é obrigatório');
    }

    try {
      const reviewRef = db.collection('reviews').doc(reviewId);
      const reviewDoc = await reviewRef.get();

      if (!reviewDoc.exists) {
        throw new HttpsError('not-found', 'Review não encontrada');
      }

      const reviewData = reviewDoc.data()!;

      // Verificar se usuário é o dono da review
      if (reviewData.userId !== userId) {
        throw new HttpsError('permission-denied', 'Você não pode deletar esta review');
      }

      // Deletar review
      await reviewRef.delete();

      // Atualizar interações do usuário (recalcular após deletar)
      const dummyReviewData = { ...reviewData, rating: 0 } as ReviewData;
      await updateUserPlaceInteraction(userId, reviewData.placeId, dummyReviewData);

      logger.info(`Review deletada com sucesso`, {
        reviewId,
        userId,
        placeId: reviewData.placeId
      });

      return {
        success: true,
        message: 'Review deletada com sucesso'
      };

    } catch (error) {
      logger.error('Erro ao deletar review', { error, userId, reviewId });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', 'Erro interno do servidor');
    }
  }
);

/**
 * Buscar reviews de um lugar com estatísticas completas
 */
export const getPlaceReviews = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { placeId, limit = 20, offset = 0, reviewType, userId: targetUserId } = request.data;

    if (!placeId) {
      throw new HttpsError('invalid-argument', 'placeId é obrigatório');
    }

    try {
      // Verificar se o place existe
      const placeDoc = await db.collection('places').doc(placeId).get();
      if (!placeDoc.exists) {
        throw new HttpsError('not-found', 'Lugar não encontrado');
      }

      logger.info(`Buscando reviews para o lugar: ${placeId}`);

      // Buscar todas as reviews para estatísticas (sem limite)
      let allReviewsQuery = db.collection('reviews')
        .where('placeId', '==', placeId);

      const allReviewsSnapshot = await allReviewsQuery.get();
      logger.info(`Total de reviews encontradas: ${allReviewsSnapshot.size}`);

      // Buscar reviews paginadas para exibição
      let paginatedQuery = db.collection('reviews')
        .where('placeId', '==', placeId);

      // Filtrar por tipo de review se especificado
      if (reviewType) {
        paginatedQuery = paginatedQuery.where('reviewType', '==', reviewType);
        logger.info(`Filtrando por reviewType: ${reviewType}`);
      }

      // Filtrar por usuário se especificado
      if (targetUserId) {
        paginatedQuery = paginatedQuery.where('userId', '==', targetUserId);
        logger.info(`Filtrando por userId: ${targetUserId}`);
      }

      // Aplicar ordenação e paginação
      paginatedQuery = paginatedQuery
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset);

      logger.info(`Executando query paginada com limit: ${limit}, offset: ${offset}`);
      const paginatedSnapshot = await paginatedQuery.get();
      logger.info(`Reviews paginadas encontradas: ${paginatedSnapshot.size}`);

      const reviewsData = paginatedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Buscar informações dos usuários das reviews paginadas
      const userIds = [...new Set(reviewsData.map(review => review.userId))];
      const usersData: { [userId: string]: any } = {};
      logger.info(`Buscando dados de ${userIds.length} usuários únicos`);

      if (userIds.length > 0) {
        // Buscar usuários em lotes (Firestore permite até 10 IDs por consulta 'in')
        const userBatches = [];
        for (let i = 0; i < userIds.length; i += 10) {
          const batch = userIds.slice(i, i + 10);
          userBatches.push(batch);
        }

        for (const batch of userBatches) {
          try {
            logger.info(`Buscando usuários do lote: ${JSON.stringify(batch)}`);
            
            const usersSnapshot = await db.collection('users')
              .where('__name__', 'in', batch)
              .get();

            logger.info(`Usuários encontrados no lote: ${usersSnapshot.size} de ${batch.length}`);

            usersSnapshot.docs.forEach(userDoc => {
              const userData = userDoc.data();
              usersData[userDoc.id] = {
                id: userDoc.id,
                name: userData.name || userData.displayName || 'Usuário',
                profileImage: userData.profileImage || userData.photoURL || null,
                username: userData.username || null
              };
            });

            // Adicionar usuários não encontrados com dados padrão
            const foundUserIds = usersSnapshot.docs.map(doc => doc.id);
            const missingUserIds = batch.filter(userId => !foundUserIds.includes(userId));
            
            if (missingUserIds.length > 0) {
              logger.warn(`Usuários não encontrados: ${JSON.stringify(missingUserIds)}`);
              missingUserIds.forEach(userId => {
                usersData[userId] = {
                  id: userId,
                  name: 'Usuário não encontrado',
                  profileImage: null,
                  username: null
                };
              });
            }

          } catch (userError) {
            logger.error('Erro ao buscar usuários:', { 
              error: userError, 
              batch,
              errorMessage: userError instanceof Error ? userError.message : 'Erro desconhecido'
            });
            
            // Adicionar dados padrão para todos os usuários do lote em caso de erro
            batch.forEach(userId => {
              usersData[userId] = {
                id: userId,
                name: 'Usuário',
                profileImage: null,
                username: null
              };
            });
          }
        }
      }

      // Enriquecer reviews com dados do usuário
      const reviews = reviewsData.map(review => ({
        ...review,
        user: usersData[review.userId] || {
          id: review.userId,
          name: 'Usuário',
          profileImage: null,
          username: null
        }
      }));

      logger.info(`Reviews enriquecidas com dados de usuário: ${reviews.length}`);

      // Calcular estatísticas completas
      const allReviews = allReviewsSnapshot.docs.map(doc => doc.data());
      
      // Agrupar por tipo
      const reviewsByType: { [key: string]: number[] } = {};
      const reviewCountByType: { [key: string]: number } = {};
      
      allReviews.forEach(review => {
        const type = review.reviewType;
        if (!reviewsByType[type]) {
          reviewsByType[type] = [];
          reviewCountByType[type] = 0;
        }
        reviewsByType[type].push(review.rating);
        reviewCountByType[type]++;
      });

      // Calcular médias por tipo
      const averagesByType: { [key: string]: number } = {};
      Object.keys(reviewsByType).forEach(type => {
        const ratings = reviewsByType[type];
        averagesByType[type] = Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10;
      });

      // Calcular média geral
      const allRatings = allReviews.map(review => review.rating);
      const overallAverage = allRatings.length > 0 
        ? Math.round((allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length) * 10) / 10
        : 0;

      return {
        success: true,
        data: {
          reviews,
          statistics: {
            totalReviews: allReviews.length,
            overallAverage,
            averagesByType,
            reviewCountByType
          },
          pagination: {
            total: paginatedSnapshot.size,
            hasMore: paginatedSnapshot.size === limit,
            limit,
            offset
          }
        }
      };

    } catch (error) {
      logger.error('Erro ao buscar reviews do lugar', { error, placeId });
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Erro interno do servidor');
    }
  }
);

/**
 * Buscar reviews de um usuário com dados enriquecidos e estatísticas
 */
export const getUserReviews = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { 
      userId: targetUserId, 
      limit = 20, 
      offset = 0,
      reviewType,           // Filtro por tipo: 'food', 'service', etc.
      minRating,           // Filtro por rating mínimo
      maxRating,           // Filtro por rating máximo
      startDate,           // Filtro por período - data início
      endDate,             // Filtro por período - data fim
      groupBy,             // 'place' ou 'category' para agrupamento
      includePlaceData = true,  // Se deve incluir dados dos lugares
      includeStats = true       // Se deve incluir estatísticas
    } = request.data;
    
    const currentUserId = request.auth?.uid;

    if (!targetUserId) {
      throw new HttpsError('invalid-argument', 'userId é obrigatório');
    }

    try {
      logger.info(`Buscando reviews do usuário: ${targetUserId}`, {
        filters: { reviewType, minRating, maxRating, startDate, endDate },
        groupBy,
        includePlaceData,
        includeStats
      });

      // Construir query base
      let query = db.collection('reviews')
        .where('userId', '==', targetUserId);

      // Aplicar filtros
      if (reviewType) {
        query = query.where('reviewType', '==', reviewType);
      }

      if (minRating !== undefined) {
        query = query.where('rating', '>=', minRating);
      }

      if (maxRating !== undefined) {
        query = query.where('rating', '<=', maxRating);
      }

      if (startDate) {
        query = query.where('createdAt', '>=', new Date(startDate));
      }

      if (endDate) {
        query = query.where('createdAt', '<=', new Date(endDate));
      }

      // Buscar todas as reviews para estatísticas (se solicitado)
      let allReviewsSnapshot;
      if (includeStats || groupBy) {
        const allReviewsQuery = db.collection('reviews').where('userId', '==', targetUserId);
        allReviewsSnapshot = await allReviewsQuery.get();
      }

      // Buscar reviews paginadas
      const paginatedSnapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      const reviewsData = paginatedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      logger.info(`Reviews encontradas: ${reviewsData.length}`);

      // Buscar dados dos lugares se solicitado
      let placesData: { [placeId: string]: any } = {};
      if (includePlaceData && reviewsData.length > 0) {
        const placeIds = [...new Set(reviewsData.map(review => review.placeId))];
        logger.info(`Buscando dados de ${placeIds.length} lugares`);

        // Buscar lugares em lotes
        const placeBatches = [];
        for (let i = 0; i < placeIds.length; i += 10) {
          const batch = placeIds.slice(i, i + 10);
          placeBatches.push(batch);
        }

        for (const batch of placeBatches) {
          try {
            const placesSnapshot = await db.collection('places')
              .where('__name__', 'in', batch)
              .get();

            placesSnapshot.docs.forEach(placeDoc => {
              const placeData = placeDoc.data();
              placesData[placeDoc.id] = {
                id: placeDoc.id,
                name: placeData.name || 'Local não identificado',
                address: placeData.address || null,
                photos: placeData.photos || [],
                mainPhoto: placeData.mainPhoto || (placeData.photos && placeData.photos[0]) || null,
                category: placeData.category || null,
                coordinates: placeData.coordinates || null
              };
            });
          } catch (placeError) {
            logger.error('Erro ao buscar dados dos lugares:', { error: placeError, batch });
          }
        }
      }

      // Enriquecer reviews com dados dos lugares
      const enrichedReviews = reviewsData.map(review => ({
        ...review,
        place: includePlaceData ? (placesData[review.placeId] || {
          id: review.placeId,
          name: 'Local não encontrado',
          address: null,
          photos: [],
          mainPhoto: null,
          category: null,
          coordinates: null
        }) : undefined
      }));

      // Calcular estatísticas do usuário se solicitado
      let userStats = null;
      if (includeStats && allReviewsSnapshot) {
        const allReviews = allReviewsSnapshot.docs.map(doc => doc.data());
        
        // Estatísticas gerais
        const totalReviews = allReviews.length;
        const allRatings = allReviews.map(r => r.rating);
        const averageRating = allRatings.length > 0 
          ? Math.round((allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length) * 10) / 10
          : 0;

        // Lugares únicos visitados
        const uniquePlaces = [...new Set(allReviews.map(r => r.placeId))];
        const placesVisited = uniquePlaces.length;

        // Estatísticas por tipo de review
        const reviewsByType: { [key: string]: number[] } = {};
        const reviewCountByType: { [key: string]: number } = {};
        
        allReviews.forEach(review => {
          const type = review.reviewType;
          if (!reviewsByType[type]) {
            reviewsByType[type] = [];
            reviewCountByType[type] = 0;
          }
          reviewsByType[type].push(review.rating);
          reviewCountByType[type]++;
        });

        const averagesByType: { [key: string]: number } = {};
        Object.keys(reviewsByType).forEach(type => {
          const ratings = reviewsByType[type];
          averagesByType[type] = Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10;
        });

        // Estatísticas por período (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentReviews = allReviews.filter(review => {
          const reviewDate = review.createdAt?.toDate ? review.createdAt.toDate() : new Date(review.createdAt);
          return reviewDate >= thirtyDaysAgo;
        });

        userStats = {
          totalReviews,
          averageRating,
          placesVisited,
          reviewCountByType,
          averagesByType,
          recentActivity: {
            last30Days: recentReviews.length,
            averageRatingLast30Days: recentReviews.length > 0 
              ? Math.round((recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length) * 10) / 10
              : 0
          },
          distribution: {
            byRating: {
              excellent: allReviews.filter(r => r.rating >= 8).length,
              good: allReviews.filter(r => r.rating >= 6 && r.rating < 8).length,
              average: allReviews.filter(r => r.rating >= 4 && r.rating < 6).length,
              poor: allReviews.filter(r => r.rating < 4).length
            }
          }
        };
      }

      // Aplicar agrupamento se solicitado
      let groupedData = null;
      if (groupBy && allReviewsSnapshot) {
        const allReviews = allReviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        if (groupBy === 'place') {
          const reviewsByPlace: { [placeId: string]: any[] } = {};
          
          allReviews.forEach(review => {
            if (!reviewsByPlace[review.placeId]) {
              reviewsByPlace[review.placeId] = [];
            }
            reviewsByPlace[review.placeId].push(review);
          });

          groupedData = Object.keys(reviewsByPlace).map(placeId => {
            const placeReviews = reviewsByPlace[placeId];
            const averageRating = placeReviews.reduce((sum, r) => sum + r.rating, 0) / placeReviews.length;
            
            return {
              placeId,
              place: includePlaceData ? placesData[placeId] : undefined,
              reviewsCount: placeReviews.length,
              averageRating: Math.round(averageRating * 10) / 10,
              reviews: placeReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
              lastVisit: placeReviews[0]?.createdAt
            };
          }).sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());

        } else if (groupBy === 'category') {
          const reviewsByCategory: { [category: string]: any[] } = {};
          
          allReviews.forEach(review => {
            const category = review.reviewType;
            if (!reviewsByCategory[category]) {
              reviewsByCategory[category] = [];
            }
            reviewsByCategory[category].push(review);
          });

          groupedData = Object.keys(reviewsByCategory).map(category => {
            const categoryReviews = reviewsByCategory[category];
            const averageRating = categoryReviews.reduce((sum, r) => sum + r.rating, 0) / categoryReviews.length;
            
            return {
              category,
              reviewsCount: categoryReviews.length,
              averageRating: Math.round(averageRating * 10) / 10,
              reviews: categoryReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
              lastReview: categoryReviews[0]?.createdAt
            };
          }).sort((a, b) => b.averageRating - a.averageRating);
        }
      }

      logger.info(`Dados processados com sucesso para usuário ${targetUserId}`, {
        reviewsReturned: enrichedReviews.length,
        statsIncluded: !!userStats,
        groupedBy: groupBy,
        placesDataIncluded: includePlaceData
      });

      return {
        success: true,
        data: {
          reviews: enrichedReviews,
          statistics: userStats,
          groupedData: groupedData,
          pagination: {
            total: paginatedSnapshot.size,
            hasMore: paginatedSnapshot.size === limit,
            limit,
            offset
          },
          filters: {
            applied: {
              reviewType,
              minRating,
              maxRating,
              startDate,
              endDate
            }
          }
        }
      };

    } catch (error) {
      logger.error('Erro ao buscar reviews do usuário', { error, targetUserId });
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Erro interno do servidor');
    }
  }
);

/**
 * Curtir/descurtir review
 */
export const toggleReviewLike = onCall(
  { region: 'us-central1' },
  async (request) => {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    // Rate limiting
    if (!rateLimiter.isAllowed(`toggle_like_${userId}`, 100, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente em 1 hora.');
    }

    const { reviewId } = request.data;

    if (!reviewId) {
      throw new HttpsError('invalid-argument', 'reviewId é obrigatório');
    }

    try {
      const reviewRef = db.collection('reviews').doc(reviewId);
      const reviewDoc = await reviewRef.get();

      if (!reviewDoc.exists) {
        throw new HttpsError('not-found', 'Review não encontrada');
      }

      const reviewData = reviewDoc.data()!;
      const likedBy = reviewData.likedBy || [];
      const hasLiked = likedBy.includes(userId);

      let updateData;
      if (hasLiked) {
        // Descurtir
        updateData = {
          likes: admin.firestore.FieldValue.increment(-1),
          likedBy: admin.firestore.FieldValue.arrayRemove(userId),
          updatedAt: serverTimestamp()
        };
      } else {
        // Curtir
        updateData = {
          likes: admin.firestore.FieldValue.increment(1),
          likedBy: admin.firestore.FieldValue.arrayUnion(userId),
          updatedAt: serverTimestamp()
        };
      }

      await reviewRef.update(updateData);

      return {
        success: true,
        liked: !hasLiked,
        message: hasLiked ? 'Like removido' : 'Review curtida'
      };

    } catch (error) {
      logger.error('Erro ao curtir/descurtir review', { error, userId, reviewId });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', 'Erro interno do servidor');
    }
  }
);

// ======================
// TRIGGERS
// ======================

/**
 * Trigger: Recalcular médias quando review é criada
 */
export const onReviewCreated = onDocumentCreated(
  { document: 'reviews/{reviewId}', region: 'us-central1' },
  async (event) => {
    const reviewData = event.data?.data();

    if (!reviewData) {
      logger.error('Dados da review não encontrados no trigger');
      return;
    }

    try {
      const placeId = reviewData.placeId;

      // Calcular novas médias
      const averages = await calculatePlaceAverages(placeId);

      // Atualizar documento do lugar
      await db.collection('places').doc(placeId).update({
        averageRatings: averages,
        updatedAt: serverTimestamp()
      });

      logger.info(`Médias recalculadas para o lugar ${placeId}`, { averages });

    } catch (error) {
      logger.error('Erro ao recalcular médias após criação de review', {
        error,
        reviewId: event.params.reviewId,
        placeId: reviewData.placeId
      });
    }
  }
);

/**
 * Trigger: Recalcular médias quando review é atualizada
 */
export const onReviewUpdated = onDocumentUpdated(
  { document: 'reviews/{reviewId}', region: 'us-central1' },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      logger.error('Dados da review não encontrados no trigger de atualização');
      return;
    }

    // Só recalcular se a nota mudou
    if (beforeData.rating !== afterData.rating) {
      try {
        const placeId = afterData.placeId;

        // Calcular novas médias
        const averages = await calculatePlaceAverages(placeId);

        // Atualizar documento do lugar
        await db.collection('places').doc(placeId).update({
          averageRatings: averages,
          updatedAt: serverTimestamp()
        });

        logger.info(`Médias recalculadas para o lugar ${placeId} após atualização`, { averages });

      } catch (error) {
        logger.error('Erro ao recalcular médias após atualização de review', {
          error,
          reviewId: event.params.reviewId,
          placeId: afterData.placeId
        });
      }
    }
  }
);

/**
 * Trigger: Recalcular médias quando review é deletada
 */
export const onReviewDeleted = onDocumentDeleted(
  { document: 'reviews/{reviewId}', region: 'us-central1' },
  async (event) => {
    const reviewData = event.data?.data();

    if (!reviewData) {
      logger.error('Dados da review não encontrados no trigger de deleção');
      return;
    }

    try {
      const placeId = reviewData.placeId;

      // Calcular novas médias
      const averages = await calculatePlaceAverages(placeId);

      // Atualizar documento do lugar
      await db.collection('places').doc(placeId).update({
        averageRatings: averages,
        updatedAt: serverTimestamp()
      });

      logger.info(`Médias recalculadas para o lugar ${placeId} após deleção`, { averages });

    } catch (error) {
      logger.error('Erro ao recalcular médias após deleção de review', {
        error,
        reviewId: event.params.reviewId,
        placeId: reviewData.placeId
      });
    }
  }
);

/**
 * Função agendada: Atualizar métricas sociais diariamente
 */
export const updateSocialMetrics = onSchedule(
  {
    schedule: '0 2 * * *', // Todo dia às 2h da manhã
    region: 'us-central1'
  },
  async () => {
    logger.info('Iniciando atualização de métricas sociais');

    try {
      // Buscar todos os usuários ativos
      const usersSnapshot = await db.collection('users')
        .where('isActive', '==', true)
        .get();

      const batchPromises = [];

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const following = userData.following || [];

        if (following.length === 0) continue;

        // Buscar todos os lugares únicos das reviews dos amigos
        const reviewsSnapshot = await db.collection('reviews')
          .where('userId', 'in', following)
          .get();

        const placeMetrics: { [placeId: string]: { ratings: number[], count: number } } = {};

        reviewsSnapshot.forEach(doc => {
          const review = doc.data();
          const placeId = review.placeId;

          if (!placeMetrics[placeId]) {
            placeMetrics[placeId] = { ratings: [], count: 0 };
          }

          placeMetrics[placeId].ratings.push(review.rating);
          placeMetrics[placeId].count++;
        });

        // Calcular médias dos amigos por lugar
        const updatePromises = Object.keys(placeMetrics).map(placeId => {
          const metrics = placeMetrics[placeId];
          const average = metrics.ratings.reduce((sum, rating) => sum + rating, 0) / metrics.ratings.length;

          return db.collection('places').doc(placeId).update({
            [`socialMetrics.${userId}`]: {
              friendsAverage: Math.round(average * 10) / 10,
              friendsCount: metrics.count,
              lastUpdated: serverTimestamp()
            }
          });
        });

        batchPromises.push(...updatePromises);
      }

      // Executar todas as atualizações
      await Promise.all(batchPromises);

      logger.info(`Métricas sociais atualizadas para ${batchPromises.length} combinações de usuário/lugar`);

    } catch (error) {
      logger.error('Erro ao atualizar métricas sociais', { error });
    }
  }
);
