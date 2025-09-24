/**
 * LIST FUNCTIONS - PINUBI FUNCTIONS
 * 
 * Funções para gerenciar listas de lugares dos usuários.
 * Inclui criação, atualização, adição/remoção de places e colaboração.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { GeoFirestore } from "geofirestore";
import { logger } from "firebase-functions";
import { GeoPoint } from 'firebase-admin/firestore';

// Inicializar Firestore
const db = getFirestore();
const geoFirestore = new GeoFirestore(db);

// ======================
// FUNÇÕES AUXILIARES
// ======================

/**
 * Cria atividade quando lugar é adicionado à lista
 */
async function createPlaceAddedActivity(
  userId: string,
  placeId: string,
  listId: string,
  googlePlaceData: any
): Promise<void> {
  const activityRef = db.collection('activities').doc();
  
  // Buscar dados da lista para a atividade
  const listDoc = await db.collection('lists').doc(listId).get();
  const listData = listDoc.data();
  
  const activityData = {
    id: activityRef.id,
    userId,
    type: 'place_added',
    data: {
      placeId,
      placeName: googlePlaceData.name || 'Lugar sem nome',
      placeAddress: googlePlaceData.address || googlePlaceData.formatted_address,
      placeCoordinates: googlePlaceData.geometry?.location ? {
        lat: googlePlaceData.geometry.location.lat,
        lng: googlePlaceData.geometry.location.lng
      } : null,
      placeCategories: googlePlaceData.types || [],
      listId,
      listName: listData?.title || 'Lista',
      listEmoji: listData?.emoji
    },
    isPublic: true,
    createdAt: Timestamp.now()
  };

  await activityRef.set(activityData);
  logger.info(`Atividade place_added criada: ${activityRef.id}`);
}

/**
 * Cria atividade quando lista é criada
 */
async function createListCreatedActivity(
  userId: string,
  listData: any,
  batch?: FirebaseFirestore.WriteBatch
): Promise<void> {
  const activityRef = db.collection('activities').doc();
  
  const activityData = {
    id: activityRef.id,
    userId,
    type: 'list_created',
    data: {
      listId: listData.id,
      listName: listData.title || 'Lista sem nome',
      listEmoji: listData.emoji || '📝',
      placesCount: listData.placesCount || 0,
      isMonetized: listData.isMonetized || false,
      categories: listData.category ? [listData.category] : [],
      tags: listData.tags || []
    },
    isPublic: listData.visibility === 'public',
    createdAt: Timestamp.now()
  };

  if (batch) {
    batch.set(activityRef, activityData);
  } else {
    await activityRef.set(activityData);
  }
  
  logger.info(`Atividade list_created criada: ${activityRef.id} para lista ${listData.id}`);
}

/**
 * Cria atividade quando lista é comprada
 */
async function createListPurchasedActivity(
  purchaseData: any,
  listData: any,
  batch?: FirebaseFirestore.WriteBatch
): Promise<void> {
  const activityRef = db.collection('activities').doc();
  
  const activityData = {
    id: activityRef.id,
    userId: purchaseData.userId,
    type: 'list_purchased',
    data: {
      listId: purchaseData.listId,
      listName: listData.title || 'Lista',
      listEmoji: listData.emoji || '💰',
      price: purchaseData.amount,
      sellerId: purchaseData.sellerId || listData.ownerId,
      sellerName: listData.ownerName // Se disponível
    },
    isPublic: true,
    createdAt: Timestamp.now()
  };

  if (batch) {
    batch.set(activityRef, activityData);
  } else {
    await activityRef.set(activityData);
  }
  
  logger.info(`Atividade list_purchased criada: ${activityRef.id} para compra ${purchaseData.id}`);
}

/**
 * Cria atividade quando lista vira pública
 */
async function createListMadePublicActivity(
  userId: string,
  listData: any,
  batch?: FirebaseFirestore.WriteBatch
): Promise<void> {
  const activityRef = db.collection('activities').doc();
  
  const activityData = {
    id: activityRef.id,
    userId,
    type: 'list_made_public',
    data: {
      listId: listData.id,
      listName: listData.title || 'Lista',
      listEmoji: listData.emoji || '🌍',
      placesCount: listData.placesCount || 0,
      category: listData.category,
      tags: listData.tags || []
    },
    isPublic: true,
    createdAt: Timestamp.now()
  };

  if (batch) {
    batch.set(activityRef, activityData);
  } else {
    await activityRef.set(activityData);
  }
  
  logger.info(`Atividade list_made_public criada: ${activityRef.id} para lista ${listData.id}`);
}

// ======================
// TRIGGERS
// ======================

/**
 * Trigger: Nova lista criada - gerar atividade automaticamente
 */
export const onListCreated = onDocumentCreated('lists/{listId}', async (event) => {
  const listData = event.data?.data();
  const listId = event.params.listId;

  if (!listData) {
    logger.warn(`Lista ${listId} criada sem dados`);
    return;
  }

  logger.info(`Trigger onListCreated disparado para lista: ${listId}`, {
    ownerId: listData.ownerId,
    title: listData.title,
    visibility: listData.visibility
  });

  try {
    // Verificar se é lista automática (criada pelo sistema)
    if (listData.isAutoGenerated || listData.isSystemList) {
      logger.info(`Lista ${listId} é automática/sistema, não criando atividade`);
      return;
    }

    // Verificar se o dono da lista existe e está ativo
    if (!listData.ownerId) {
      logger.warn(`Lista ${listId} criada sem ownerId`);
      return;
    }

    const userDoc = await db.collection('users').doc(listData.ownerId).get();
    const userData = userDoc.data();

    if (!userData || !userData.isActive) {
      logger.warn(`Usuário ${listData.ownerId} não encontrado ou inativo`);
      return;
    }

    // Criar atividade
    await createListCreatedActivity(listData.ownerId, {
      id: listId,
      ...listData
    });

    logger.info(`Atividade list_created criada com sucesso para lista ${listId}`);

  } catch (error) {
    logger.error(`Erro ao processar criação da lista ${listId}:`, error);
  }
});

/**
 * Trigger: Nova compra registrada - gerar atividade automaticamente
 */
export const onPurchaseCreated = onDocumentCreated('purchases/{purchaseId}', async (event) => {
  const purchaseData = event.data?.data();
  const purchaseId = event.params.purchaseId;

  if (!purchaseData) {
    logger.warn(`Compra ${purchaseId} criada sem dados`);
    return;
  }

  logger.info(`Trigger onPurchaseCreated disparado para compra: ${purchaseId}`, {
    userId: purchaseData.userId,
    listId: purchaseData.listId,
    amount: purchaseData.amount
  });

  try {
    // Verificar se a compra foi completada
    if (purchaseData.status !== 'completed') {
      logger.info(`Compra ${purchaseId} não está completa (${purchaseData.status}), não criando atividade`);
      return;
    }

    // Buscar dados da lista comprada
    const listDoc = await db.collection('lists').doc(purchaseData.listId).get();
    if (!listDoc.exists) {
      logger.warn(`Lista ${purchaseData.listId} não encontrada para compra ${purchaseId}`);
      return;
    }

    const listData = listDoc.data()!;

    // Verificar se o comprador existe e está ativo
    const userDoc = await db.collection('users').doc(purchaseData.userId).get();
    const userData = userDoc.data();

    if (!userData || !userData.isActive) {
      logger.warn(`Usuário comprador ${purchaseData.userId} não encontrado ou inativo`);
      return;
    }

    // Criar atividade
    await createListPurchasedActivity({
      id: purchaseId,
      ...purchaseData
    }, listData);

    logger.info(`Atividade list_purchased criada com sucesso para compra ${purchaseId}`);

  } catch (error) {
    logger.error(`Erro ao processar compra ${purchaseId}:`, error);
  }
});

/**
 * Trigger: Lista atualizada - verificar se virou monetizada
 */
export const onListUpdated = onDocumentUpdated('lists/{listId}', async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();
  const listId = event.params.listId;

  if (!beforeData || !afterData) return;

  // Verificar se lista virou monetizada
  const wasMonetized = beforeData.isMonetized;
  const isNowMonetized = afterData.isMonetized;

  if (!wasMonetized && isNowMonetized && afterData.price > 0) {
    logger.info(`Lista ${listId} foi monetizada por ${afterData.ownerId}`, {
      price: afterData.price,
      title: afterData.title
    });

    // Aqui você pode criar uma atividade específica para monetização
    // ou notificar seguidores, etc.
    
    try {
      const activityRef = db.collection('activities').doc();
      await activityRef.set({
        id: activityRef.id,
        userId: afterData.ownerId,
        type: 'list_monetized',
        data: {
          listId,
          listName: afterData.title,
          listEmoji: afterData.emoji,
          price: afterData.price
        },
        isPublic: true,
        createdAt: Timestamp.now()
      });

      logger.info(`Atividade list_monetized criada para lista ${listId}`);
    } catch (error) {
      logger.error(`Erro ao criar atividade de monetização:`, error);
    }
  }
});

// ====================================
// FUNÇÃO PRINCIPAL: ADD PLACE TO LIST
// ====================================

export const addPlaceToList = onCall(
  {
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 60,
    enforceAppCheck: false,
  },
  async (request) => {
    const startTime = Date.now();
    
    try {
      // Verificar autenticação
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Usuário deve estar autenticado");
      }

      const userId = request.auth.uid;
      const { googlePlaceId, googlePlaceData, listId, personalNote, tags } = request.data;

      // Validar parâmetros obrigatórios
      if (!googlePlaceId || !listId) {
        throw new HttpsError(
          "invalid-argument",
          "googlePlaceId e listId são obrigatórios"
        );
      }

      // 1. Verificar se o usuário pode editar a lista
      const listDoc = await db.collection('lists').doc(listId).get();
      if (!listDoc.exists) {
        throw new HttpsError("not-found", "Lista não encontrada");
      }

      const listData = listDoc.data()!;
      const canEdit = listData.ownerId === userId || 
                     listData.editors?.some((editor: any) => editor.userId === userId && editor.permission === 'edit');

      if (!canEdit) {
        throw new HttpsError("permission-denied", "Sem permissão para editar esta lista");
      }

      // 2. Verificar se place já existe no Firestore
      let placeId = googlePlaceId;
      let placeExists = false;
      
      const existingPlace = await db.collection('places').doc(googlePlaceId).get();
      if (existingPlace.exists) {
        placeExists = true;
        logger.info(`Place ${googlePlaceId} já existe no Firestore`);
      } else {
        // 3. Criar place no Firestore se não existir
        logger.info(`Criando novo place ${googlePlaceId} no Firestore`);
        
        const newPlaceData = await createPlaceFromGoogleData(googlePlaceData, userId);
        const geoCollection = geoFirestore.collection('places');
        await geoCollection.doc(googlePlaceId).set(newPlaceData);
        
        logger.info(`Place ${googlePlaceId} criado com sucesso`);
      }

      // 4. Verificar se place já está na lista
      const existingListPlace = await db.collection('listPlaces')
        .where('listId', '==', listId)
        .where('placeId', '==', placeId)
        .limit(1)
        .get();

      if (!existingListPlace.empty) {
        throw new HttpsError("already-exists", "Este lugar já está na lista");
      }

      // 5. Adicionar place à lista
      const listPlaceData = {
        listId: listId,
        placeId: placeId,
        addedBy: userId,
        addedAt: Timestamp.now(),
        order: await getNextOrderInList(listId),
        personalNote: personalNote || '',
        tags: tags || [],
        createdAt: Timestamp.now()
      };

      const listPlaceRef = db.collection('listPlaces').doc();
      await listPlaceRef.set(listPlaceData);

      // 6. Atualizar contadores da lista
      await db.collection('lists').doc(listId).update({
        placesCount: FieldValue.increment(1),
        updatedAt: Timestamp.now()
      });

      // 7. Atualizar métricas do place
      await db.collection('places').doc(placeId).update({
        'socialMetrics.totalAdds': FieldValue.increment(1),
        updatedAt: Timestamp.now()
      });

      // 8. Atualizar contador do usuário
      await db.collection('users').doc(userId).update({
        placesCount: FieldValue.increment(placeExists ? 0 : 1),
        updatedAt: Timestamp.now()
      });

      // 9. Criar atividade para o feed
      await createPlaceAddedActivity(userId, placeId, listId, googlePlaceData);

      const executionTime = Date.now() - startTime;
      logger.info(`addPlaceToList concluída em ${executionTime}ms`, {
        userId,
        listId,
        placeId,
        placeCreated: !placeExists
      });

      return {
        success: true,
        placeId: placeId,
        listPlaceId: listPlaceRef.id,
        placeCreated: !placeExists,
        message: placeExists 
          ? "Lugar adicionado à lista com sucesso" 
          : "Novo lugar criado e adicionado à lista com sucesso"
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Erro em addPlaceToList após ${executionTime}ms:`, error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError("internal", "Erro interno do servidor");
    }
  }
);

// ====================================
// FUNÇÃO AUXILIAR: CRIAR PLACE DO GOOGLE DATA
// ====================================

async function createPlaceFromGoogleData(googlePlaceData: any, userId: string) {
  const coordinates = googlePlaceData.geometry?.location;
  if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
    throw new HttpsError("invalid-argument", "Coordenadas válidas são obrigatórias");
  }

  // Processar dados do Google Places
  const placeData = {
    id: googlePlaceData.googlePlaceId,
    name: googlePlaceData.name || 'Lugar sem nome',
    
    // Dados obrigatórios para Firestore Rules
    googleData: {
      name: googlePlaceData.name || 'Lugar sem nome',
      formatted_address: googlePlaceData.address || '',
      place_id: googlePlaceData.googlePlaceId,
      rating: googlePlaceData.rating || 0,
      user_ratings_total: googlePlaceData.user_ratings_total || 0,
      types: googlePlaceData.types || [],
      geometry: {
        location: {
          lat: coordinates.lat,
          lng: coordinates.lng
        }
      },
      photos: googlePlaceData.photos || [],
      price_level: googlePlaceData.price_level,
      opening_hours: googlePlaceData.opening_hours,
      website: googlePlaceData.website,
      phone: googlePlaceData.international_phone_number,
      lastUpdated: Timestamp.now()
    },

    // Coordenadas para GeoFirestore (obrigatório)
    coordinates: new GeoPoint(coordinates.lat, coordinates.lng),
    
    // Campo 'g' será adicionado automaticamente pelo GeoFirestore

    // Categorização automática
    category: categorizePlaceFromTypes(googlePlaceData.types || []),
    categories: extractCategoriesFromTypes(googlePlaceData.types || []),
    
    // Busca e performance
    searchableText: generateSearchableText(googlePlaceData),
    searchKeywords: generateSearchKeywords(googlePlaceData.name || ''),
    
    // Métricas da plataforma
    averageRatings: {
      overall: convertGoogleRatingToInternal(googlePlaceData.rating),
      totalReviews: 0,
      food: 0,
      service: 0,
      atmosphere: 0
    },
    
    socialMetrics: {
      totalAdds: 0,
      totalLikes: 0,
      totalShares: 0
    },

    // Status e configurações
    isActive: true,
    isOpen24h: checkIf24Hours(googlePlaceData.opening_hours),
    averagePrice: googlePlaceData.price_level || 2,
    reviewCount: 0,

    // Timestamps
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    lastGoogleSync: Timestamp.now(),
    
    // Criador
    createdBy: userId,

    // Dados opcionais
    address: googlePlaceData.address,
    description: `Lugar adicionado do Google Places: ${googlePlaceData.name}`,
    tags: []
  };

  return placeData;
}

// ====================================
// FUNÇÕES AUXILIARES
// ====================================

function categorizePlaceFromTypes(types: string[]): string {
  const typeMap: { [key: string]: string } = {
    'restaurant': 'restaurant',
    'food': 'restaurant',
    'meal_takeaway': 'restaurant',
    'meal_delivery': 'restaurant',
    'cafe': 'cafe',
    'bar': 'bar',
    'night_club': 'bar',
    'tourist_attraction': 'attraction',
    'museum': 'attraction',
    'park': 'attraction',
    'shopping_mall': 'shopping',
    'store': 'shopping',
    'lodging': 'hotel',
    'gym': 'fitness',
    'spa': 'wellness'
  };

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }
  
  return 'other';
}

function extractCategoriesFromTypes(types: string[]): string[] {
  const relevantTypes = ['restaurant', 'cafe', 'bar', 'food', 'tourist_attraction', 
                        'shopping_mall', 'gym', 'spa', 'museum', 'park'];
  
  return types.filter(type => relevantTypes.includes(type));
}

function generateSearchableText(googleData: any): string {
  const parts = [
    googleData.name?.toLowerCase(),
    googleData.address?.toLowerCase(),
    googleData.types?.join(' ').toLowerCase()
  ].filter(Boolean);
  
  return parts.join(' ');
}

function generateSearchKeywords(name: string): string[] {
  if (!name) return [];
  
  return name.toLowerCase()
    .split(' ')
    .filter(word => word.length > 2)
    .slice(0, 10); // Limitar a 10 palavras-chave
}

function convertGoogleRatingToInternal(googleRating?: number): number {
  if (!googleRating) return 0;
  // Converter de 0-5 (Google) para 0-10 (interno)
  return (googleRating / 5) * 10;
}

function checkIf24Hours(openingHours?: any): boolean {
  if (!openingHours?.periods) return false;
  
  return openingHours.periods.some((period: any) => 
    period.open && !period.close
  );
}

async function getNextOrderInList(listId: string): Promise<number> {
  const lastPlace = await db.collection('listPlaces')
    .where('listId', '==', listId)
    .orderBy('order', 'desc')
    .limit(1)
    .get();
  
  if (lastPlace.empty) {
    return 0;
  }
  
  return lastPlace.docs[0].data().order + 1;
}

// ====================================
// FUNÇÃO: ALTERAR VISIBILIDADE DA LISTA
// ====================================

export const toggleListVisibility = onCall(
  {
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 30,
    enforceAppCheck: false,
  },
  async (request) => {
    const startTime = Date.now();
    
    try {
      // Verificar autenticação
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Usuário deve estar autenticado");
      }

      const userId = request.auth.uid;
      const { listId, isPublic } = request.data;

      // Validar parâmetros obrigatórios
      if (!listId || typeof isPublic !== 'boolean') {
        throw new HttpsError(
          "invalid-argument", 
          "listId (string) e isPublic (boolean) são obrigatórios"
        );
      }

      logger.info(`toggleListVisibility chamado`, {
        userId,
        listId, 
        isPublic,
        requestedVisibility: isPublic ? 'public' : 'private'
      });

      // 1. Verificar se a lista existe
      const listDoc = await db.collection('lists').doc(listId).get();
      if (!listDoc.exists) {
        throw new HttpsError("not-found", "Lista não encontrada");
      }

      const listData = listDoc.data()!;

      // 2. Verificar se o usuário é o dono da lista
      if (listData.ownerId !== userId) {
        logger.warn(`Tentativa de alteração de visibilidade não autorizada`, {
          userId,
          listId,
          actualOwnerId: listData.ownerId
        });
        throw new HttpsError(
          "permission-denied", 
          "Apenas o dono da lista pode alterar sua visibilidade"
        );
      }

      // 3. Atualizar visibilidade da lista
      await db.collection('lists').doc(listId).update({
        visibility: isPublic ? "public" : "private",
        updatedAt: Timestamp.now()
      });

      if (isPublic) {
        await createListMadePublicActivity(userId, {
          id: listId,
          ...listData
        });
        logger.info(`Lista ${listId} virou pública - atividade criada`);
      }

      const executionTime = Date.now() - startTime;
      logger.info(`toggleListVisibility concluída em ${executionTime}ms`, {
        userId,
        listId,
        isPublic,
      });

      return {
        success: true,
        message: `Lista alterada para ${isPublic ? 'pública' : 'privada'} com sucesso`,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Erro em toggleListVisibility após ${executionTime}ms:`, error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError("internal", "Erro interno do servidor");
    }
  }
);

// ====================================
// FUNÇÃO: REMOVER PLACE DA LISTA
// ====================================

export const removePlaceFromList = onCall(
  {
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 30,
    enforceAppCheck: false,
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Usuário deve estar autenticado");
      }

      const userId = request.auth.uid;
      const { listId, placeId } = request.data;

      if (!listId || !placeId) {
        throw new HttpsError("invalid-argument", "listId e placeId são obrigatórios");
      }

      // Verificar permissão na lista
      const listDoc = await db.collection('lists').doc(listId).get();
      if (!listDoc.exists) {
        throw new HttpsError("not-found", "Lista não encontrada");
      }

      const listData = listDoc.data()!;
      const canEdit = listData.ownerId === userId || 
                     listData.editors?.some((editor: any) => editor.userId === userId && editor.permission === 'edit');

      if (!canEdit) {
        throw new HttpsError("permission-denied", "Sem permissão para editar esta lista");
      }

      // Encontrar e remover listPlace
      const listPlaceQuery = await db.collection('listPlaces')
        .where('listId', '==', listId)
        .where('placeId', '==', placeId)
        .limit(1)
        .get();

      if (listPlaceQuery.empty) {
        throw new HttpsError("not-found", "Lugar não encontrado na lista");
      }

      const listPlaceDoc = listPlaceQuery.docs[0];
      await listPlaceDoc.ref.delete();

      // Atualizar contadores
      await db.collection('lists').doc(listId).update({
        placesCount: FieldValue.increment(-1),
        updatedAt: Timestamp.now()
      });

      await db.collection('places').doc(placeId).update({
        'socialMetrics.totalAdds': FieldValue.increment(-1),
        updatedAt: Timestamp.now()
      });

      return {
        success: true,
        message: "Lugar removido da lista com sucesso"
      };

    } catch (error) {
      logger.error("Erro em removePlaceFromList:", error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError("internal", "Erro interno do servidor");
    }
  }
);

// ====================================
// FUNÇÃO: BUSCAR LISTA PÚBLICA PARA NEXT.JS
// ====================================

export const getPublicListData = onCall(
  {
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 60,
    enforceAppCheck: false,
  },
  async (request) => {
    const startTime = Date.now();
    
    try {
      const { listId, authToken } = request.data;

      // Validar parâmetros obrigatórios
      if (!listId || !authToken) {
        throw new HttpsError(
          "invalid-argument",
          "listId e authToken são obrigatórios"
        );
      }

      logger.info(`getPublicListData chamado`, {
        listId,
        hasToken: !!authToken
      });

      const SHARED_TOKEN = "tfn9xq6Mj7fAiftKAiC8uH4RMhOqIYv3";
      
      if (authToken !== SHARED_TOKEN) {
        logger.warn(`Token inválido para acesso à lista ${listId}`);
        throw new HttpsError("permission-denied", "Token de acesso inválido");
      }

      // 2. Buscar dados da lista
      const listDoc = await db.collection('lists').doc(listId).get();
      if (!listDoc.exists) {
        throw new HttpsError("not-found", "Lista não encontrada");
      }

      const listData = listDoc.data()!;

      // 3. Verificar se lista é pública ou se tem link público ativo
      if (listData.visibility !== 'public') {
        throw new HttpsError(
          "permission-denied", 
          "Esta lista não está disponível publicamente"
        );
      }

      // 4. Buscar informações do dono da lista
      let ownerData = null;
      if (listData.ownerId) {
        const ownerDoc = await db.collection('users').doc(listData.ownerId).get();
        if (ownerDoc.exists) {
          const owner = ownerDoc.data()!;
          ownerData = {
            id: listData.ownerId,
            name: owner.name,
            username: owner.username,
            profilePicture: owner.profilePicture || null,
            followersCount: owner.followersCount || 0,
            isVerified: owner.isVerified || false
          };
        }
      }

      // 5. Buscar todos os lugares da lista
      const listPlacesSnapshot = await db.collection('listPlaces')
        .where('listId', '==', listId)
        .orderBy('order', 'asc')
        .get();

      const places = [];
      
      for (const listPlaceDoc of listPlacesSnapshot.docs) {
        const listPlaceData = listPlaceDoc.data();
        
        // Buscar dados completos do lugar
        const placeDoc = await db.collection('places').doc(listPlaceData.placeId).get();
        if (placeDoc.exists) {
          const placeData = placeDoc.data()!;
          
          places.push({
            // Dados do lugar na lista
            listPlaceId: listPlaceDoc.id,
            order: listPlaceData.order,
            personalNote: listPlaceData.personalNote || '',
            tags: listPlaceData.tags || [],
            addedAt: listPlaceData.addedAt,
            addedBy: listPlaceData.addedBy,
            
            // Dados completos do lugar
            id: placeData.id,
            name: placeData.name,
            coordinates: {
              lat: placeData.coordinates?.latitude || placeData.googleData?.geometry?.location?.lat,
              lng: placeData.coordinates?.longitude || placeData.googleData?.geometry?.location?.lng
            },
            
            // Dados do Google Places
            googleData: {
              name: placeData.googleData?.name,
              formatted_address: placeData.googleData?.formatted_address,
              rating: placeData.googleData?.rating || 0,
              user_ratings_total: placeData.googleData?.user_ratings_total || 0,
              types: placeData.googleData?.types || [],
              photos: placeData.googleData?.photos || [],
              price_level: placeData.googleData?.price_level,
              opening_hours: placeData.googleData?.opening_hours,
              website: placeData.googleData?.website,
              phone: placeData.googleData?.phone
            },
            
            // Dados da plataforma
            category: placeData.category,
            categories: placeData.categories || [],
            averageRatings: placeData.averageRatings || {
              overall: 0,
              totalReviews: 0,
              food: 0,
              service: 0,
              atmosphere: 0
            },
            socialMetrics: placeData.socialMetrics || {
              totalAdds: 0,
              totalLikes: 0,
              totalShares: 0
            },
            reviewCount: placeData.reviewCount || 0,
            averagePrice: placeData.averagePrice || 2,
            isOpen24h: placeData.isOpen24h || false,
            description: placeData.description,
            
            // Timestamps
            createdAt: placeData.createdAt,
            updatedAt: placeData.updatedAt
          });
        }
      }

      // 6. Estruturar resposta completa
      const response = {
        success: true,
        data: {
          // Informações da lista
          list: {
            id: listId,
            title: listData.title,
            description: listData.description,
            emoji: listData.emoji,
            category: listData.category,
            tags: listData.tags || [],
            visibility: listData.visibility,
            
            // Estatísticas
            placesCount: listData.placesCount || places.length,
            likesCount: listData.likesCount || 0,
            sharesCount: listData.sharesCount || 0,
            viewsCount: listData.viewsCount || 0,
            
            // Monetização
            isMonetized: listData.isMonetized || false,
            price: listData.price || 0,
            
            // Colaboração
            isCollaborative: listData.isCollaborative || false,
            editorsCount: listData.editors?.length || 0,
            
            // Timestamps
            createdAt: listData.createdAt,
            updatedAt: listData.updatedAt,
          },
          
          // Informações do dono
          owner: ownerData,
          
          // Lugares da lista
          places: places,
          
          // Metadados para SEO/compartilhamento
          metadata: {
            totalPlaces: places.length,
            lastUpdated: listData.updatedAt,
            averageRating: places.length > 0 
              ? places.reduce((sum, place) => sum + (place.googleData?.rating || 0), 0) / places.length 
              : 0,
            categories: [...new Set(places.map(place => place.category).filter(Boolean))],
            priceRange: {
              min: Math.min(...places.map(place => place.googleData?.price_level || 2).filter(Boolean)),
              max: Math.max(...places.map(place => place.googleData?.price_level || 2).filter(Boolean))
            }
          }
        }
      };

      const executionTime = Date.now() - startTime;
      logger.info(`getPublicListData concluída em ${executionTime}ms`, {
        listId,
        placesCount: places.length,
        hasOwner: !!ownerData
      });

      return response;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Erro em getPublicListData após ${executionTime}ms:`, error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError("internal", "Erro interno do servidor");
    }
  }
);
