import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentUpdated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
// import { beforeUserCreated, beforeUserSignedIn } from 'firebase-functions/v2/identity';
import * as logger from 'firebase-functions/logger';
import { db, auth, admin } from '../config/firebase';
import { rateLimiter, serverTimestamp, incrementField } from '../utils/helpers';
import * as firebaseAdmin from 'firebase-admin';


// ======================
// FUNÇÕES AUXILIARES
// ======================

/**
 * Gera um código único de convite
 */
function generateUniqueCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Cria atividade para o usuário
 */
async function createActivity(
  userId: string,
  type: string,
  data: any,
  isPublic: boolean = true,
  batch?: admin.firestore.WriteBatch
): Promise<void> {
  const activityRef = db.collection('activities').doc();
  const activityData = {
    id: activityRef.id,
    userId,
    type,
    data,
    isPublic,
    createdAt: serverTimestamp()
  };

  if (batch) {
    batch.set(activityRef, activityData);
  } else {
    await activityRef.set(activityData);
  }
}

// ======================
// TRIGGERS DE USUÁRIO
// ======================

// Trigger quando um usuário é criado no Firebase Auth
// export const onUserCreate = beforeUserCreated(async (event) => {
//   const user = event.data;
//   const userId = user.uid;

//   logger.info(`Novo usuário criado no Auth: ${userId}`, {
//     email: user.email,
//     displayName: user.displayName
//   });

//   try {
//     // Preparar estrutura completa seguindo Database Schema
//     const userData: any = {
//       // Campos básicos
//       id: userId,
//       email: user.email || '',
//       displayName: user.displayName || '',
//       photoURL: user.photoURL || '',
//       accountType: 'free', // "free" | "premium"
//       profileVisibility: 'public', // "public" | "private"

//       // Sistema de Convites e Ativação - ESTADO INICIAL (onboarding)
//       inviteCode: generateUniqueCode(),
//       maxInvites: 5,
//       invitesUsed: 0,
//       invitedBy: null,
//       invitedUsers: [],

//       // Estados de Validação e Ativação - EM ONBOARDING
//       isValidated: false, // Não validado inicialmente
//       isActive: false, // Não ativo inicialmente
//       onboardingComplete: false,
//       validatedAt: null,

//       // Métricas e Limites - ZERADOS (até validação)
//       listsCount: 0,
//       placesCount: 0,
//       aiCredits: 0, // Sem créditos até validar
//       aiCreditsLastReset: null,
//       votationsThisMonth: 0,

//       // Configurações - BÁSICAS
//       preferences: {
//         categories: [],
//         priceRange: [1, 4],
//         dietaryRestrictions: []
//       },

//       // Relacionamentos - VAZIOS (até validação)
//       following: [],
//       followers: [],
//       pendingFriendRequests: [],

//       // Timestamps
//       createdAt: serverTimestamp(),
//       lastLoginAt: serverTimestamp(),

//       // Localização - VAZIA (será definida durante onboarding)
//       location: {
//         country: '',
//         state: '',
//         city: '',
//         coordinates: {
//           lat: 0,
//           lng: 0
//         }
//       },

//       // Timestamps de controle
//       updatedAt: serverTimestamp()
//     };

//     // Criar documento do usuário no Firestore
//     await db.collection('users').doc(userId).set(userData);
//     logger.info(`Documento do usuário criado no Firestore: ${userId}`);

//     // NÃO criar listas automáticas ainda - só após validação do convite
//     // NÃO criar perfil e settings ainda - só após ativação completa

//   } catch (error) {
//     logger.error(`Erro ao processar criação do usuário ${userId}:`, error);
//     // Não devemos impedir a criação do usuário por erros internos
//     // O usuário ainda será criado no Auth mesmo se falhar aqui
//   }
// });

// Remove the entire commented onUserCreate export (lines 53-136)

// Add this new callable function that does the exact same thing:
export const initializeNewUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const userId = request.auth.uid;

    // Rate limiting
    if (!rateLimiter.isAllowed(`initialize_user_${userId}`, 3, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    // Verificar se usuário já foi inicializado
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists && userDoc.data()?.onboardingComplete !== undefined) {
      throw new HttpsError('already-exists', 'Usuário já foi inicializado');
    }

    // Buscar dados do Firebase Auth
    const authUser = await auth.getUser(userId);

    logger.info(`Novo usuário criado no Auth: ${userId}`, {
      email: authUser.email,
      displayName: authUser.displayName
    });

    // Preparar estrutura completa seguindo Database Schema (EXACT same code)
    const userData: any = {
      // Campos básicos
      id: userId,
      email: authUser.email || '',
      displayName: authUser.displayName || '',
      photoURL: authUser.photoURL || '',
      accountType: 'free', // "free" | "premium"
      profileVisibility: 'public', // "public" | "private"

      // Sistema de Convites e Ativação - ESTADO INICIAL (onboarding)
      inviteCode: generateUniqueCode(),
      maxInvites: 5,
      invitesUsed: 0,
      invitedBy: null,
      invitedUsers: [],

      // Estados de Validação e Ativação - EM ONBOARDING
      isValidated: false, // Não validado inicialmente
      isActive: false, // Não ativo inicialmente
      onboardingComplete: false,
      validatedAt: null,

      // Métricas e Limites - ZERADOS (até validação)
      listsCount: 0,
      placesCount: 0,
      aiCredits: 0, // Sem créditos até validar
      aiCreditsLastReset: null,
      votationsThisMonth: 0,

      // Configurações - BÁSICAS
      preferences: {
        categories: [],
        priceRange: [1, 4],
        dietaryRestrictions: []
      },

      // Relacionamentos - VAZIOS (até validação)
      following: [],
      followers: [],
      pendingFriendRequests: [],

      // Timestamps
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),

      // Localização - VAZIA (será definida durante onboarding)
      location: {
        country: '',
        state: '',
        city: '',
        coordinates: {
          lat: 0,
          lng: 0
        }
      },

      // Timestamps de controle
      updatedAt: serverTimestamp()
    };

    // Criar documento do usuário no Firestore
    await db.collection('users').doc(userId).set(userData);
    logger.info(`Documento do usuário criado no Firestore: ${userId}`);

    // NÃO criar listas automáticas ainda - só após validação do convite
    // NÃO criar perfil e settings ainda - só após ativação completa

    return {
      success: true,
      message: 'Usuário inicializado com sucesso',
      inviteCode: userData.inviteCode,
      user: {
        id: userId,
        email: userData.email,
        displayName: userData.displayName,
        isValidated: false,
        isActive: false
      }
    };

  } catch (error) {
    logger.error(`Erro ao processar criação do usuário ${request.auth?.uid}:`, error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

// Trigger quando um usuário é atualizado
export const onUserUpdate = onDocumentUpdated('users/{userId}', async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();
  const userId = event.params.userId;

  if (!beforeData || !afterData) return;

  logger.info(`Usuário atualizado: ${userId}`);

  try {
    const batch = db.batch();
    let needsBatchCommit = false;

    // NÃO atualizar updatedAt automaticamente para evitar loop infinito
    // Só atualizar quando houver mudanças específicas abaixo

    // Verificar mudança para Premium
    if (beforeData.accountType === 'free' && afterData.accountType === 'premium') {
      await handleUpgradeToPremium(userId, afterData, batch);
      needsBatchCommit = true;
    }

    // Verificar mudança de visibilidade do perfil
    if (beforeData.profileVisibility !== afterData.profileVisibility) {
      await handleProfileVisibilityChange(userId, afterData.profileVisibility, batch);
      needsBatchCommit = true;
    }

    // Se o nome foi alterado, atualizar no perfil também
    if (beforeData.displayName !== afterData.displayName) {
      const profileRef = db.collection('profiles').doc(userId);
      batch.update(profileRef, {
        displayName: afterData.displayName,
        updatedAt: serverTimestamp()
      });
      needsBatchCommit = true;
      logger.info(`Nome atualizado no perfil para usuário: ${userId}`);
    }

    // Se o email foi alterado, atualizar no Authentication
    if (beforeData.email !== afterData.email) {
      await auth.updateUser(userId, {
        email: afterData.email
      });
      logger.info(`Email atualizado no Authentication para usuário: ${userId}`);
    }

    if (needsBatchCommit) {
      await batch.commit();
    }

  } catch (error) {
    logger.error(`Erro ao processar atualização do usuário ${userId}:`, error);
  }
});

/**
 * Processa upgrade para Premium
 */
async function handleUpgradeToPremium(
  userId: string,
  userData: any,
  batch: admin.firestore.WriteBatch
): Promise<void> {
  // Atualizar créditos de IA para Premium (garantir pelo menos 20)
  const newCredits = Math.max(userData.aiCredits || 0, 20);

  batch.update(db.collection('users').doc(userId), {
    aiCredits: newCredits
  });

  // Criar atividade
  await createActivity(userId, 'account_upgraded', {
    fromPlan: 'free',
    toPlan: 'premium'
  }, false, batch);

  logger.info(`Usuário ${userId} foi upgradeado para Premium`);
}

/**
 * Processa mudança de visibilidade do perfil
 */
async function handleProfileVisibilityChange(
  userId: string,
  newVisibility: string,
  batch: admin.firestore.WriteBatch
): Promise<void> {
  // Verificar se documento de configurações existe antes de atualizar
  const settingsRef = db.collection('user-settings').doc(userId);
  const settingsDoc = await settingsRef.get();

  if (settingsDoc.exists) {
    batch.update(settingsRef, {
      'privacy.profilePublic': newVisibility === 'public',
      updatedAt: serverTimestamp()
    });
  } else {
    // Se não existe, criar o documento
    batch.set(settingsRef, {
      userId: userId,
      notifications: {
        email: true,
        push: true,
        sms: false,
        newFollower: true,
        listPurchased: true,
        socialMatch: true,
        votation: true
      },
      privacy: {
        profilePublic: newVisibility === 'public',
        showEmail: false,
        allowInvites: true
      },
      theme: 'light',
      language: 'pt-BR',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  // Criar atividade se tornou público
  if (newVisibility === 'public') {
    await createActivity(userId, 'profile_visibility_changed', {
      newVisibility: 'public'
    }, true, batch);
  }

  logger.info(`Visibilidade do perfil alterada para ${newVisibility}: ${userId}`);
}

// Trigger quando um usuário é deletado
export const onUserDelete = onDocumentDeleted('users/{userId}', async (event) => {
  const userId = event.params.userId;
  const userData = event.data?.data();

  logger.info(`Usuário deletado: ${userId}`, { userData });

  try {
    // Limpar dados relacionados
    const batch = db.batch();

    // Deletar perfil
    const profileRef = db.collection('profiles').doc(userId);
    batch.delete(profileRef);

    // Deletar configurações
    const settingsRef = db.collection('user-settings').doc(userId);
    batch.delete(settingsRef);

    // Executar operações em lote
    await batch.commit();

    // Deletar do Authentication (se ainda existir)
    try {
      await auth.deleteUser(userId);
      logger.info(`Usuário removido do Authentication: ${userId}`);
    } catch (authError) {
      logger.warn(`Usuário não encontrado no Authentication (já pode ter sido removido): ${userId}`);
    }

    logger.info(`Dados relacionados removidos para usuário: ${userId}`);
  } catch (error) {
    logger.error(`Erro ao limpar dados do usuário ${userId}:`, error);
  }
});

// ======================
// FUNCTIONS CALLABLE DE USUÁRIO
// ======================

// Validar código de convite e ativar usuário
export const validateInviteAndActivateUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const { inviteCode } = request.data;
    const userId = request.auth.uid;

    if (!inviteCode) {
      throw new HttpsError('invalid-argument', 'Código de convite é obrigatório');
    }

    // Aplicar rate limiting
    if (!rateLimiter.isAllowed(`validate_activate_${userId}`, 5, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    // Verificar se usuário já está validado
    const currentUserDoc = await db.collection('users').doc(userId).get();
    const currentUserData = currentUserDoc.data();

    if (!currentUserData) {
      throw new HttpsError('not-found', 'Usuário não encontrado');
    }

    if (currentUserData.isValidated) {
      throw new HttpsError('failed-precondition', 'Usuário já está validado');
    }

    // Buscar usuário dono do convite
    const usersSnapshot = await db.collection('users')
      .where('inviteCode', '==', inviteCode.toUpperCase())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      throw new HttpsError('not-found', 'Código de convite inválido');
    }

    const inviterDoc = usersSnapshot.docs[0];
    const inviterData = inviterDoc.data();

    // Verificar se ainda tem convites disponíveis
    if (inviterData.invitesUsed >= inviterData.maxInvites) {
      throw new HttpsError('resource-exhausted', 'Este código de convite já foi usado o máximo de vezes');
    }

    // ATIVAR USUÁRIO COMPLETAMENTE seguindo Database Schema
    const batch = db.batch();

    // 1. Atualizar dados do usuário (ativar e validar) - Database Schema completo
    const userUpdates = {
      // Estados de Validação e Ativação - ATIVADO
      isValidated: true,
      isActive: true,
      onboardingComplete: true,
      validatedAt: new Date().toISOString(),

      // Sistema de Convites
      invitedBy: inviterDoc.id,

      // Métricas e Limites - ATIVADOS
      listsCount: 2, // Listas automáticas que serão criadas
      placesCount: 0,
      aiCredits: currentUserData.accountType === 'premium' ? 50 : 5, // Créditos iniciais
      aiCreditsLastReset: new Date().toISOString(),
      votationsThisMonth: 0,

      // Timestamps
      updatedAt: serverTimestamp()
    };

    batch.update(db.collection('users').doc(userId), userUpdates);

    // 2. Atualizar convidador seguindo Database Schema
    const inviterUpdates = {
      invitesUsed: inviterData.invitesUsed + 1,
      invitedUsers: [...(inviterData.invitedUsers || []), userId],
      aiCredits: (inviterData.aiCredits || 0) + 10, // Bonus por convidar
      updatedAt: serverTimestamp()
    };

    batch.update(inviterDoc.ref, inviterUpdates);

    // 3. Criar listas automáticas seguindo Database Schema
    const now = new Date().toISOString();

    // Lista "Quero Visitar"
    const wantToVisitList = {
      id: `${userId}_want_to_visit`,
      title: "Quero Visitar",
      emoji: "🎯",
      description: "Lugares que quero conhecer",
      ownerId: userId,
      visibility: "private",
      editors: [],
      isMonetized: false,
      price: 0,
      purchasedBy: [],
      placesCount: 0,
      tags: ["want-to-visit", "wishlist"],
      category: "personal",
      isSystemList: false,
      isAutoGenerated: true,
      canDelete: false,
      canRename: false,
      autoListType: "want_to_visit",
      createdAt: now,
      updatedAt: now,
      regions: []
    };
    batch.set(db.collection('lists').doc(`${userId}_want_to_visit`), wantToVisitList);

    // Lista "Favoritas"
    const favoritesList = {
      id: `${userId}_favorites`,
      title: "Favoritos",
      emoji: "⭐",
      description: "Meus lugares favoritos",
      ownerId: userId,
      visibility: "public",
      editors: [],
      isMonetized: false,
      price: 0,
      purchasedBy: [],
      placesCount: 0,
      tags: ["favorites", "top-places"],
      category: "personal",
      isSystemList: false,
      isAutoGenerated: true,
      canDelete: false,
      canRename: false,
      autoListType: "favorites",
      createdAt: now,
      updatedAt: now,
      regions: []
    };
    batch.set(db.collection('lists').doc(`${userId}_favorites`), favoritesList);

    // 4. Criar perfil público seguindo Database Schema
    const profileRef = db.collection('profiles').doc(userId);
    batch.set(profileRef, {
      id: userId,
      userId: userId,
      displayName: currentUserData.displayName || 'Usuário',
      email: currentUserData.email || '',
      isActive: true,
      profileComplete: true,
      followersCount: 0,
      followingCount: 0,
      listsCount: 2, // Listas automáticas
      placesCount: 0,
      reviewsCount: 0,
      createdAt: now,
      updatedAt: now
    });

    // 5. Criar configurações seguindo Database Schema
    const settingsRef = db.collection('user-settings').doc(userId);
    batch.set(settingsRef, {
      id: userId,
      userId: userId,
      notifications: {
        email: true,
        push: true,
        sms: false,
        newFollower: true,
        listPurchased: true,
        socialMatch: true,
        votation: true
      },
      privacy: {
        profilePublic: true, // Free sempre público
        showEmail: false,
        allowInvites: true
      },
      theme: "light",
      language: "pt-BR",
      createdAt: now,
      updatedAt: now
    });

    // 6. Criar atividade para o convidador seguindo Database Schema
    const activityRef = db.collection('activities').doc();
    batch.set(activityRef, {
      id: activityRef.id,
      userId: inviterDoc.id,
      type: 'user_invited',
      data: {
        invitedUserId: userId,
        invitedUserName: currentUserData.displayName || 'Usuário'
      },
      isPublic: false,
      createdAt: now
    });

    await batch.commit();

    logger.info(`Usuário ${userId} ativado com sucesso via convite de ${inviterDoc.id}`);

    return {
      success: true,
      message: 'Usuário ativado com sucesso seguindo Database Schema!',
      inviterName: inviterData.displayName || 'Convidador',
      creditsReceived: currentUserData.accountType === 'premium' ? 50 : 5
    };

  } catch (error) {
    logger.error('Erro ao validar convite e ativar usuário:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

// Consultar status de convites do usuário
export const getUserInviteStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    if (!rateLimiter.isAllowed(`get_invite_status_${request.auth.uid}`, 20, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    const userId = request.auth.uid;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado');
    }

    const userData = userDoc.data();

    // Buscar usuários que foram convidados por este usuário
    const invitedUsersSnapshot = await db.collection('users')
      .where('invitedBy', '==', userId)
      .select('displayName', 'name', 'createdAt')
      .get();

    const invitedUsers = invitedUsersSnapshot.docs.map(doc => ({
      name: doc.data().displayName || doc.data().name,
      createdAt: doc.data().createdAt
    }));

    return {
      inviteCode: userData?.inviteCode,
      invitesUsed: userData?.invitesUsed || 0,
      maxInvites: userData?.maxInvites || 5,
      invitesRemaining: (userData?.maxInvites || 5) - (userData?.invitesUsed || 0),
      invitedUsers
    };

  } catch (error) {
    logger.error('Erro ao consultar status de convites:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

// Seguir usuário
export const followUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    if (!rateLimiter.isAllowed(`follow_user_${request.auth.uid}`, 50, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    const { userToFollowId } = request.data;
    const currentUserId = request.auth.uid;

    if (!userToFollowId) {
      throw new HttpsError('invalid-argument', 'ID do usuário a seguir é obrigatório');
    }

    if (currentUserId === userToFollowId) {
      throw new HttpsError('invalid-argument', 'Não é possível seguir a si mesmo');
    }

    // Verificar se o usuário a ser seguido existe
    const userToFollowDoc = await db.collection('users').doc(userToFollowId).get();
    if (!userToFollowDoc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado');
    }

    const userToFollowData = userToFollowDoc.data();

    // Verificar se é perfil privado
    if (userToFollowData?.profileVisibility === 'private') {
      // Para perfis privados, criar solicitação de amizade
      return await createFriendRequest(currentUserId, userToFollowId);
    }

    // Para perfis públicos, seguir diretamente
    const followRef = db.collection('follows').doc(`${currentUserId}_${userToFollowId}`);
    const followDoc = await followRef.get();

    if (followDoc.exists) {
      throw new HttpsError('already-exists', 'Você já segue este usuário');
    }

    const batch = db.batch();

    // Criar relacionamento de follow
    batch.set(followRef, {
      followerId: currentUserId,
      followingId: userToFollowId,
      createdAt: serverTimestamp()
    });

    // Atualizar contadores
    const followerProfileRef = db.collection('profiles').doc(currentUserId);
    const newFollowingCount = await incrementField(followerProfileRef, 'followingCount', 1);
    batch.update(followerProfileRef, {
      followingCount: newFollowingCount
    });

    const followingProfileRef = db.collection('profiles').doc(userToFollowId);
    const newFollowersCount = await incrementField(followingProfileRef, 'followersCount', 1);
    batch.update(followingProfileRef, {
      followersCount: newFollowersCount
    });

    // Criar atividade
    await createActivity(currentUserId, 'user_followed', {
      followedUserId: userToFollowId,
      followedUserName: userToFollowData?.displayName || userToFollowData?.name
    }, true, batch);

    // Dar créditos por seguir amigo
    const currentUserRef = db.collection('users').doc(currentUserId);
    const newUserAiCredits = await incrementField(currentUserRef, 'aiCredits', 5);
    batch.update(currentUserRef, {
      aiCredits: newUserAiCredits
    });

    await batch.commit();

    return { success: true, message: 'Usuário seguido com sucesso' };

  } catch (error) {
    logger.error('Erro ao seguir usuário:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

// Criar solicitação de amizade (para perfis privados)
async function createFriendRequest(fromUserId: string, toUserId: string) {
  const requestRef = db.collection('friendRequests').doc(`${fromUserId}_${toUserId}`);
  const existingRequest = await requestRef.get();

  if (existingRequest.exists) {
    throw new HttpsError('already-exists', 'Solicitação já enviada');
  }

  await requestRef.set({
    fromUserId,
    toUserId,
    status: 'pending',
    createdAt: serverTimestamp()
  });

  // Criar notificação para o usuário
  await db.collection('notifications').add({
    userId: toUserId,
    type: 'friend_request',
    title: 'Nova solicitação de amizade',
    message: 'Alguém quer seguir seu perfil privado',
    data: { fromUserId },
    isRead: false,
    createdAt: serverTimestamp()
  });

  return { success: true, message: 'Solicitação de amizade enviada' };
}

// Deixar de seguir usuário
export const unfollowUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const { userToUnfollowId } = request.data;
    const currentUserId = request.auth.uid;

    if (!userToUnfollowId) {
      throw new HttpsError('invalid-argument', 'ID do usuário é obrigatório');
    }

    if (currentUserId === userToUnfollowId) {
      throw new HttpsError('invalid-argument', 'Não é possível deixar de seguir a si mesmo');
    }

    // Rate limiting
    if (!rateLimiter.isAllowed(`unfollow_user_${currentUserId}`, 30, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    // Verificar se está seguindo
    const followRef = db.collection('follows').doc(`${currentUserId}_${userToUnfollowId}`);
    const followDoc = await followRef.get();

    if (!followDoc.exists) {
      throw new HttpsError('not-found', 'Você não segue este usuário');
    }

    const batch = db.batch();

    // Remover relacionamento de follow
    batch.delete(followRef);

    // Atualizar contadores
    const followerProfileRef = db.collection('profiles').doc(currentUserId);
    const newFollowingCount = await incrementField(followerProfileRef, 'followingCount', -1);
    batch.update(followerProfileRef, {
      followingCount: Math.max(0, newFollowingCount) // Garantir que não fique negativo
    });

    const followingProfileRef = db.collection('profiles').doc(userToUnfollowId);
    const newFollowersCount = await incrementField(followingProfileRef, 'followersCount', -1);
    batch.update(followingProfileRef, {
      followersCount: Math.max(0, newFollowersCount) // Garantir que não fique negativo
    });

    await batch.commit();

    logger.info(`Usuário ${currentUserId} deixou de seguir ${userToUnfollowId}`);

    return { success: true, message: 'Deixou de seguir o usuário com sucesso' };

  } catch (error) {
    logger.error('Erro ao deixar de seguir usuário:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

// Verificar status de relacionamento
export const checkFollowStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const { targetUserId } = request.data;
    const currentUserId = request.auth.uid;

    if (!targetUserId) {
      throw new HttpsError('invalid-argument', 'ID do usuário é obrigatório');
    }

    // Rate limiting
    if (!rateLimiter.isAllowed(`check_follow_${currentUserId}`, 100, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    // Verificar se está seguindo
    const followDoc = await db.collection('follows')
      .doc(`${currentUserId}_${targetUserId}`)
      .get();

    // Verificar se é seguido de volta (follow mútuo)
    const followBackDoc = await db.collection('follows')
      .doc(`${targetUserId}_${currentUserId}`)
      .get();

    return {
      success: true,
      isFollowing: followDoc.exists,
      isFollowedBy: followBackDoc.exists,
      isMutual: followDoc.exists && followBackDoc.exists,
      followedAt: followDoc.exists ? followDoc.data()?.createdAt : null
    };

  } catch (error) {
    logger.error('Erro ao verificar status de follow:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

// Function para buscar dados do usuário
export const getUserData = onCall(async (request) => {
  try {
    const identifier = request.auth?.uid || 'anonymous';
    if (!rateLimiter.isAllowed(`get_user_data_${identifier}`, 100, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    const { userId } = request.data;

    if (!userId) {
      throw new HttpsError('invalid-argument', 'ID do usuário é obrigatório');
    }

    // Buscar dados do usuário
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado');
    }

    const userData = userDoc.data();

    // Verificar privacidade do perfil
    if (userData?.profileVisibility === 'private' && request.auth?.uid !== userId) {
      // Verificar se é seguidor
      const followDoc = await db.collection('follows').doc(`${request.auth?.uid}_${userId}`).get();
      if (!followDoc.exists) {
        // Retornar apenas dados básicos para perfis privados
        return {
          success: true,
          data: {
            user: {
              displayName: userData.displayName || userData.name,
              profileVisibility: userData.profileVisibility,
              accountType: userData.accountType
            },
            isPrivate: true
          }
        };
      }
    }

    // Buscar também o perfil e configurações
    const [profileDoc, settingsDoc] = await Promise.all([
      db.collection('profiles').doc(userId).get(),
      db.collection('user-settings').doc(userId).get()
    ]);

    return {
      success: true,
      data: {
        user: userData,
        profile: profileDoc.exists ? profileDoc.data() : null,
        settings: settingsDoc.exists ? settingsDoc.data() : null
      }
    };
  } catch (error) {
    logger.error('Erro ao buscar usuário:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno ao buscar dados');
  }
});

// Function para atualizar perfil do usuário
export const updateUserProfile = onCall(async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    if (!rateLimiter.isAllowed(`update_profile_${request.auth.uid}`, 20, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    const { displayName, bio, avatar, profileVisibility } = request.data;
    const userId = request.auth.uid;

    // Buscar dados atuais do usuário
    const currentUserDoc = await db.collection('users').doc(userId).get();
    const currentUserData = currentUserDoc.data();

    if (!currentUserData) {
      throw new HttpsError('not-found', 'Usuário não encontrado');
    }

    const updates: any = {
      updatedAt: serverTimestamp()
    };

    if (displayName !== undefined) {
      if (!displayName || displayName.trim().length < 2 || displayName.trim().length > 50) {
        throw new HttpsError('invalid-argument', 'Nome deve ter entre 2 e 50 caracteres');
      }
      updates.displayName = displayName.trim();
    }

    if (bio !== undefined) {
      if (bio && bio.length > 300) {
        throw new HttpsError('invalid-argument', 'Bio deve ter no máximo 300 caracteres');
      }
      updates.bio = bio;
    }

    if (avatar !== undefined) {
      updates.avatar = avatar;
    }

    // Controle de privacidade - apenas Premium pode ter perfil privado
    if (profileVisibility !== undefined) {
      if (profileVisibility === 'private' && currentUserData.accountType !== 'premium') {
        throw new HttpsError('permission-denied', 'Apenas usuários Premium podem ter perfil privado');
      }
      updates.profileVisibility = profileVisibility;
    }

    const batch = db.batch();

    // Atualizar no Firestore
    batch.update(db.collection('users').doc(userId), updates);

    // Atualizar também no perfil se houver displayName e se o perfil existir
    if (displayName !== undefined) {
      const profileRef = db.collection('profiles').doc(userId);
      const profileDoc = await profileRef.get();

      if (profileDoc.exists) {
        batch.update(profileRef, {
          displayName: displayName.trim(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Se o perfil não existe, criar um básico
        batch.set(profileRef, {
          id: userId,
          userId: userId,
          displayName: displayName.trim(),
          email: currentUserData.email || '',
          isActive: true,
          profileComplete: true,
          followersCount: 0,
          followingCount: 0,
          listsCount: currentUserData.listsCount || 0,
          placesCount: currentUserData.placesCount || 0,
          reviewsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: serverTimestamp()
        });
      }
    }

    await batch.commit();

    logger.info(`Perfil atualizado para usuário: ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error('Erro ao atualizar perfil:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno ao atualizar perfil');
  }
});

// Function para listar usuários (apenas admins)
export const listUsers = onCall(async (request) => {
  // Verificar se o usuário está autenticado
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    if (!rateLimiter.isAllowed(`list_users_${request.auth.uid}`, 10, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    // Verificar se o usuário é admin
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Acesso negado - apenas administradores');
    }

    const { limit = 10, startAfter } = request.data;

    // Construir query
    let query = db.collection('users').orderBy('createdAt', 'desc').limit(limit);

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    // Buscar usuários do Firestore
    const usersSnapshot = await query.get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      users: users,
      hasMore: usersSnapshot.docs.length === limit
    };
  } catch (error) {
    logger.error('Erro ao listar usuários:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno ao listar usuários');
  }
});

// Function para desativar usuário (soft delete)
export const deactivateUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    if (!rateLimiter.isAllowed(`deactivate_user_${request.auth.uid}`, 5, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    const { userId } = request.data;

    // Verificar permissões (apenas admin ou o próprio usuário)
    const requestingUserDoc = await db.collection('users').doc(request.auth.uid).get();
    const requestingUserData = requestingUserDoc.data();

    const isAdmin = requestingUserData?.role === 'admin';
    const isSelfDeactivation = request.auth.uid === userId;

    if (!isAdmin && !isSelfDeactivation) {
      throw new HttpsError('permission-denied', 'Sem permissão para desativar este usuário');
    }

    // Desativar usuário
    await db.collection('users').doc(userId).update({
      isActive: false,
      deactivatedAt: serverTimestamp(),
      deactivatedBy: request.auth.uid,
      updatedAt: serverTimestamp()
    });

    // Desabilitar no Authentication
    await auth.updateUser(userId, {
      disabled: true
    });

    logger.info(`Usuário desativado: ${userId} por ${request.auth.uid}`);
    return { success: true };
  } catch (error) {
    logger.error('Erro ao desativar usuário:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno ao desativar usuário');
  }
});

// Validar código de convite (apenas validar, sem ativar)
export const validateInviteCode = onCall(async (request) => {
  try {
    const { inviteCode } = request.data;

    if (!inviteCode) {
      throw new HttpsError('invalid-argument', 'Código de convite é obrigatório');
    }

    // Aplicar rate limiting
    const identifier = request.auth?.uid || 'anonymous';
    if (!rateLimiter.isAllowed(`validate_invite_${identifier}`, 10, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    // Buscar usuário dono do convite
    const usersSnapshot = await db.collection('users')
      .where('inviteCode', '==', inviteCode.toUpperCase())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      throw new HttpsError('not-found', 'Código de convite inválido');
    }

    const inviterDoc = usersSnapshot.docs[0];
    const inviterData = inviterDoc.data();

    // Verificar se ainda tem convites disponíveis
    if (inviterData.invitesUsed >= inviterData.maxInvites) {
      throw new HttpsError('resource-exhausted', 'Este código de convite já foi usado o máximo de vezes');
    }

    return {
      valid: true,
      inviterName: inviterData.displayName || inviterData.name,
      inviterId: inviterDoc.id
    };

  } catch (error) {
    logger.error('Erro ao validar código de convite:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

// ======================
// FUNÇÕES DE DESCOBERTA DE USUÁRIOS
// ======================

// Buscar usuários por nome
export const searchUsers = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const { query, limit = 20, startAfter } = request.data;
    const currentUserId = request.auth.uid;

    if (!query || query.trim().length < 2) {
      throw new HttpsError('invalid-argument', 'Query deve ter pelo menos 2 caracteres');
    }

    // Rate limiting
    if (!rateLimiter.isAllowed(`search_users_${currentUserId}`, 50, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    const searchTerm = query.trim().toLowerCase();

    // Buscar usuários por nome
    let usersQuery = db.collection('users')
      .where('profileVisibility', '==', 'public')
      .where('isActive', '==', true)
      .where('isValidated', '==', true)
      .orderBy('displayName')
      .limit(limit);

    if (startAfter) {
      usersQuery = usersQuery.startAfter(startAfter);
    }

    const usersSnapshot = await usersQuery.get();
    
    // Filtrar por nome (Firestore não suporta busca case-insensitive nativamente)
    const filteredUsers = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter((user: any) => 
        user.id !== currentUserId && // Excluir próprio usuário
        user.displayName?.toLowerCase().includes(searchTerm)
      );

    // Buscar status de relacionamento para cada usuário
    const usersWithStatus = await Promise.all(
      filteredUsers.map(async (user: any) => {
        const followDoc = await db.collection('follows')
          .doc(`${currentUserId}_${user.id}`)
          .get();

        return {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          accountType: user.accountType,
          location: user.location,
          preferences: user.preferences,
          isFollowing: followDoc.exists,
          createdAt: user.createdAt
        };
      })
    );

    return {
      success: true,
      users: usersWithStatus,
      hasMore: usersSnapshot.docs.length === limit,
      query: searchTerm
    };

  } catch (error) {
    logger.error('Erro ao buscar usuários:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

// Encontrar usuários próximos geograficamente
export const findNearbyUsers = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const { radius = 50, limit = 20 } = request.data;
    const currentUserId = request.auth.uid;

    // Rate limiting
    if (!rateLimiter.isAllowed(`nearby_users_${currentUserId}`, 30, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    // Buscar dados do usuário atual
    const currentUserDoc = await db.collection('users').doc(currentUserId).get();
    const currentUserData = currentUserDoc.data();

    if (!currentUserData?.location?.coordinates) {
      throw new HttpsError('failed-precondition', 'Localização do usuário necessária');
    }

    const userCoords = currentUserData.location.coordinates;

    // Buscar usuários próximos
    const nearbyUsersSnapshot = await db.collection('users')
      .where('profileVisibility', '==', 'public')
      .where('isActive', '==', true)
      .where('isValidated', '==', true)
      .limit(limit * 3) // Buscar mais para filtrar depois
      .get();

    const nearbyUsers = [];

    for (const userDoc of nearbyUsersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Pular próprio usuário
      if (userDoc.id === currentUserId) continue;

      // Verificar se tem coordenadas
      if (!userData.location?.coordinates) continue;

      // Calcular distância
      const distance = calculateDistance(
        userCoords.lat, userCoords.lng,
        userData.location.coordinates.lat, userData.location.coordinates.lng
      );

      // Filtrar por raio
      if (distance <= radius) {
        // Verificar se já segue
        const followDoc = await db.collection('follows')
          .doc(`${currentUserId}_${userDoc.id}`)
          .get();

        nearbyUsers.push({
          id: userDoc.id,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          accountType: userData.accountType,
          location: {
            city: userData.location.city,
            state: userData.location.state
          },
          distance: Math.round(distance * 10) / 10, // 1 casa decimal
          isFollowing: followDoc.exists,
          mutualInterests: calculateMutualInterests(
            currentUserData.preferences?.categories || [],
            userData.preferences?.categories || []
          )
        });
      }
    }

    // Ordenar por distância
    nearbyUsers.sort((a, b) => a.distance - b.distance);

    return {
      success: true,
      users: nearbyUsers.slice(0, limit),
      userLocation: `${currentUserData.location.city}, ${currentUserData.location.state}`,
      radius
    };

  } catch (error) {
    logger.error('Erro ao buscar usuários próximos:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

// Sugerir usuários baseado em interesses e atividade
export const getUserSuggestions = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const { limit = 15 } = request.data;
    const currentUserId = request.auth.uid;

    // Rate limiting
    if (!rateLimiter.isAllowed(`user_suggestions_${currentUserId}`, 20, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    // Buscar dados do usuário atual
    const currentUserDoc = await db.collection('users').doc(currentUserId).get();
    const currentUserData = currentUserDoc.data();

    if (!currentUserData) {
      throw new HttpsError('not-found', 'Usuário não encontrado');
    }

    const suggestions = [];

    // 1. Sugestões baseadas em amigos mútuos (seguidos dos seguidos)
    const mutualSuggestions = await getMutualFollowSuggestions(currentUserId, currentUserData);
    suggestions.push(...mutualSuggestions);

    // 2. Sugestões baseadas em interesses similares
    const interestSuggestions = await getInterestBasedSuggestions(currentUserId, currentUserData);
    suggestions.push(...interestSuggestions);

    // 3. Sugestões baseadas em localização + atividade
    const locationSuggestions = await getLocationBasedSuggestions(currentUserId, currentUserData);
    suggestions.push(...locationSuggestions);

    // Remover duplicatas e usuários já seguidos
    const uniqueSuggestions = await filterAndScoreSuggestions(suggestions, currentUserId);

    // Ordenar por score de relevância
    uniqueSuggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      success: true,
      suggestions: uniqueSuggestions.slice(0, limit),
      categories: {
        mutualFollows: mutualSuggestions.length,
        similarInterests: interestSuggestions.length,
        nearbyActive: locationSuggestions.length
      }
    };

  } catch (error) {
    logger.error('Erro ao buscar sugestões:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

// Explorar usuários por categoria/interesse
export const exploreUsersByCategory = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const { category, limit = 20, orderBy = 'activity' } = request.data;
    const currentUserId = request.auth.uid;

    if (!category) {
      throw new HttpsError('invalid-argument', 'Categoria é obrigatória');
    }

    // Rate limiting
    if (!rateLimiter.isAllowed(`explore_users_${currentUserId}`, 40, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    // Buscar usuários com interesse na categoria
    const usersSnapshot = await db.collection('users')
      .where('profileVisibility', '==', 'public')
      .where('isActive', '==', true)
      .where('isValidated', '==', true)
      .where('preferences.categories', 'array-contains', category)
      .limit(limit * 2)
      .get();

    const users = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Pular próprio usuário
      if (userDoc.id === currentUserId) continue;

      // Verificar se já segue
      const followDoc = await db.collection('follows')
        .doc(`${currentUserId}_${userDoc.id}`)
        .get();

      if (followDoc.exists) continue; // Pular usuários já seguidos

      // Buscar estatísticas do usuário
      const profileDoc = await db.collection('profiles').doc(userDoc.id).get();
      const profileData = profileDoc.data();

      // Calcular score de atividade
      const activityScore = calculateActivityScore(profileData);

      users.push({
        id: userDoc.id,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        accountType: userData.accountType,
        location: userData.location ? {
          city: userData.location.city,
          state: userData.location.state
        } : null,
        preferences: userData.preferences,
        stats: {
          followersCount: profileData?.followersCount || 0,
          listsCount: profileData?.listsCount || 0,
          placesCount: profileData?.placesCount || 0,
          reviewsCount: profileData?.reviewsCount || 0
        },
        activityScore,
        commonInterests: userData.preferences?.categories?.filter(cat => 
          cat !== category
        ) || []
      });
    }

    // Ordenar baseado no critério escolhido
    if (orderBy === 'activity') {
      users.sort((a, b) => b.activityScore - a.activityScore);
    } else if (orderBy === 'followers') {
      users.sort((a, b) => b.stats.followersCount - a.stats.followersCount);
    } else if (orderBy === 'recent') {
      users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return {
      success: true,
      users: users.slice(0, limit),
      category,
      orderBy,
      totalFound: users.length
    };

  } catch (error) {
    logger.error('Erro ao explorar usuários por categoria:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

// ======================
// FUNÇÕES AUXILIARES PARA SUGESTÕES
// ======================

/**
 * Calcula distância entre coordenadas (reutilizada do feed-functions)
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
 * Calcula interesses mútuos entre usuários
 */
function calculateMutualInterests(categories1: string[], categories2: string[]): string[] {
  return categories1.filter(cat => categories2.includes(cat));
}

/**
 * Busca sugestões baseadas em amigos mútuos
 */
async function getMutualFollowSuggestions(currentUserId: string, currentUserData: any) {
  const suggestions = [];
  
  // Buscar quem eu sigo
  const followingSnapshot = await db.collection('follows')
    .where('followerId', '==', currentUserId)
    .where('status', '==', 'active')
    .limit(10) // Limitar para performance
    .get();

  // Para cada usuário que eu sigo, buscar quem eles seguem
  for (const followDoc of followingSnapshot.docs) {
    const followedUserId = followDoc.data().followingId;
    
    const mutualFollowsSnapshot = await db.collection('follows')
      .where('followerId', '==', followedUserId)
      .where('status', '==', 'active')
      .limit(10)
      .get();

    for (const mutualFollowDoc of mutualFollowsSnapshot.docs) {
      const suggestedUserId = mutualFollowDoc.data().followingId;
      
      if (suggestedUserId !== currentUserId) {
        suggestions.push({
          userId: suggestedUserId,
          reason: 'mutual_follow',
          score: 8,
          mutualFriendId: followedUserId
        });
      }
    }
  }

  return suggestions;
}

/**
 * Busca sugestões baseadas em interesses similares
 */
async function getInterestBasedSuggestions(currentUserId: string, currentUserData: any) {
  const suggestions = [];
  const userCategories = currentUserData.preferences?.categories || [];

  if (userCategories.length === 0) return suggestions;

  // Buscar usuários com categorias similares
  for (const category of userCategories) {
    const usersSnapshot = await db.collection('users')
      .where('profileVisibility', '==', 'public')
      .where('isActive', '==', true)
      .where('preferences.categories', 'array-contains', category)
      .limit(15)
      .get();

    usersSnapshot.docs.forEach(doc => {
      if (doc.id !== currentUserId) {
        const commonInterests = calculateMutualInterests(
          userCategories,
          doc.data().preferences?.categories || []
        );

        suggestions.push({
          userId: doc.id,
          reason: 'similar_interests',
          score: Math.min(10, commonInterests.length * 2),
          commonInterests
        });
      }
    });
  }

  return suggestions;
}

/**
 * Busca sugestões baseadas em localização e atividade
 */
async function getLocationBasedSuggestions(currentUserId: string, currentUserData: any) {
  const suggestions = [];

  if (!currentUserData.location?.city) return suggestions;

  // Buscar usuários da mesma cidade
  const localUsersSnapshot = await db.collection('users')
    .where('profileVisibility', '==', 'public')
    .where('isActive', '==', true)
    .where('location.city', '==', currentUserData.location.city)
    .limit(20)
    .get();

  for (const userDoc of localUsersSnapshot.docs) {
    if (userDoc.id !== currentUserId) {
      // Verificar atividade recente
      const recentActivity = await db.collection('activities')
        .where('userId', '==', userDoc.id)
        .where('isPublic', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(3)
        .get();

      if (!recentActivity.empty) {
        suggestions.push({
          userId: userDoc.id,
          reason: 'local_active',
          score: 6 + recentActivity.docs.length,
          recentActivityCount: recentActivity.docs.length
        });
      }
    }
  }

  return suggestions;
}

/**
 * Filtra duplicatas e calcula score final
 */
async function filterAndScoreSuggestions(suggestions: any[], currentUserId: string) {
  const userMap = new Map();

  // Consolidar sugestões por usuário
  for (const suggestion of suggestions) {
    const userId = suggestion.userId;
    
    if (userMap.has(userId)) {
      // Combinar scores
      const existing = userMap.get(userId);
      existing.relevanceScore += suggestion.score;
      existing.reasons.push(suggestion.reason);
    } else {
      // Verificar se já segue
      const followDoc = await db.collection('follows')
        .doc(`${currentUserId}_${userId}`)
        .get();

      if (!followDoc.exists) {
        // Buscar dados do usuário
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          
          userMap.set(userId, {
            id: userId,
            displayName: userData?.displayName,
            photoURL: userData?.photoURL,
            accountType: userData?.accountType,
            location: userData?.location ? {
              city: userData.location.city,
              state: userData.location.state
            } : null,
            relevanceScore: suggestion.score,
            reasons: [suggestion.reason],
            ...suggestion
          });
        }
      }
    }
  }

  return Array.from(userMap.values());
}

/**
 * Calcula score de atividade do usuário
 */
function calculateActivityScore(profileData: any): number {
  if (!profileData) return 0;

  const weights = {
    lists: 2,
    places: 1,
    reviews: 3,
    followers: 0.1
  };

  return (
    (profileData.listsCount || 0) * weights.lists +
    (profileData.placesCount || 0) * weights.places +
    (profileData.reviewsCount || 0) * weights.reviews +
    (profileData.followersCount || 0) * weights.followers
  );
}

/**
 * Lista os seguidores de um usuário
 */
export const getFollowers = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  const data = request.data;
  const userId = data.userId || request.auth?.uid;
  const limit = Math.min(data.limit || 20, 50);
  const startAfter = data.startAfter;

  if (!userId) {
    throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  // Rate limiting
  if (!rateLimiter.isAllowed(`getFollowers:${request.auth?.uid}`, 50, 3600)) {
    throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente em alguns segundos.');
  }

  try {
    let query = db
      .collection('follows')
      .where('followingId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (startAfter) {
      const startAfterDoc = await db.collection('follows').doc(startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const followsSnapshot = await query.get();
    const followers = [];

    for (const followDoc of followsSnapshot.docs) {
      const followData = followDoc.data();
      const followerProfileSnapshot = await db
        .collection('profiles')
        .doc(followData.followerId)
        .get();

      if (followerProfileSnapshot.exists) {
        const profileData = followerProfileSnapshot.data();
        followers.push({
          id: followerProfileSnapshot.id,
          name: profileData?.displayName || profileData?.name,
          username: profileData?.username,
          avatar: profileData?.avatar,
          bio: profileData?.bio,
          location: profileData?.location,
          followersCount: profileData?.followersCount || 0,
          followingCount: profileData?.followingCount || 0,
          followedAt: followData.createdAt,
          followId: followDoc.id,
        });
      }
    }

    return {
      followers,
      hasMore: followsSnapshot.docs.length === limit,
      lastDoc: followsSnapshot.docs.length > 0 ? followsSnapshot.docs[followsSnapshot.docs.length - 1].id : null
    };

  } catch (error) {
    logger.error('Erro ao buscar seguidores:', error);
    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Lista quem o usuário está seguindo
 */
export const getFollowing = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  const data = request.data;
  const userId = data.userId || request.auth?.uid;
  const limit = Math.min(data.limit || 20, 50);
  const startAfter = data.startAfter;

  if (!userId) {
    throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  // Rate limiting
  if (!rateLimiter.isAllowed(`getFollowing:${request.auth?.uid}`, 50, 3600)) {
    throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente em alguns segundos.');
  }

  try {
    let query = db
      .collection('follows')
      .where('followerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (startAfter) {
      const startAfterDoc = await db.collection('follows').doc(startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const followsSnapshot = await query.get();
    const following = [];

    for (const followDoc of followsSnapshot.docs) {
      const followData = followDoc.data();
      const followingProfileSnapshot = await db
        .collection('profiles')
        .doc(followData.followingId)
        .get();

      if (followingProfileSnapshot.exists) {
        const profileData = followingProfileSnapshot.data();
        following.push({
          id: followingProfileSnapshot.id,
          name: profileData?.displayName ||profileData?.name,
          username: profileData?.username,
          avatar: profileData?.avatar,
          bio: profileData?.bio,
          location: profileData?.location,
          followersCount: profileData?.followersCount || 0,
          followingCount: profileData?.followingCount || 0,
          followedAt: followData.createdAt,
          followId: followDoc.id
        });
      }
    }

    return {
      following,
      hasMore: followsSnapshot.docs.length === limit,
      lastDoc: followsSnapshot.docs.length > 0 ? followsSnapshot.docs[followsSnapshot.docs.length - 1].id : null
    };

  } catch (error) {
    logger.error('Erro ao buscar usuários seguidos:', error);
    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Obtém estatísticas de relacionamento de um usuário
 */
export const getFollowStats = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  const data = request.data;
  const userId = data.userId || request.auth?.uid;

  if (!userId) {
    throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  // Rate limiting
  if (!rateLimiter.isAllowed(`getFollowStats:${request.auth?.uid}`, 100, 3600)) {
    throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente em alguns segundos.');
  }

  try {
    const [followersSnapshot, followingSnapshot] = await Promise.all([
      db.collection('follows').where('followingId', '==', userId).get(),
      db.collection('follows').where('followerId', '==', userId).get()
    ]);

    return {
      followersCount: followersSnapshot.size,
      followingCount: followingSnapshot.size
    };

  } catch (error) {
    logger.error('Erro ao buscar estatísticas de seguimento:', error);
    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Lista solicitações de follow pendentes (para perfis privados)
 */
export const getFollowRequests = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  const data = request.data;
  const limit = Math.min(data.limit || 20, 50);
  const startAfter = data.startAfter;

  // Rate limiting
  if (!rateLimiter.isAllowed(`getFollowRequests:${request.auth?.uid}`, 50, 3600)) {
    throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente em alguns segundos.');
  }

  try {
    let query = db
      .collection('follows')
      .where('followingId', '==', request.auth.uid)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (startAfter) {
      const startAfterDoc = await db.collection('follows').doc(startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const followsSnapshot = await query.get();
    const requests = [];

    for (const followDoc of followsSnapshot.docs) {
      const followData = followDoc.data();
      const requesterProfileSnapshot = await db
        .collection('profiles')
        .doc(followData.followerId)
        .get();

      if (requesterProfileSnapshot.exists) {
        const profileData = requesterProfileSnapshot.data();
        requests.push({
          id: followDoc.id,
          requesterId: followData.followerId,
          requesterName: profileData?.name,
          requesterUsername: profileData?.username,
          requesterAvatar: profileData?.avatar,
          requesterBio: profileData?.bio,
          followersCount: profileData?.followersCount || 0,
          requestedAt: followData.createdAt,
          status: followData.status
        });
      }
    }

    return {
      requests,
      hasMore: followsSnapshot.docs.length === limit,
      lastDoc: followsSnapshot.docs.length > 0 ? followsSnapshot.docs[followsSnapshot.docs.length - 1].id : null
    };

  } catch (error) {
    logger.error('Erro ao buscar solicitações de follow:', error);
    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Aceita uma solicitação de follow
 */
export const acceptFollowRequest = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  const { requestId } = request.data;

  if (!requestId) {
    throw new HttpsError('invalid-argument', 'ID da solicitação é obrigatório');
  }

  // Rate limiting
  if (!rateLimiter.isAllowed(`acceptFollowRequest:${request.auth?.uid}`, 30, 3600)) {
    throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente em alguns segundos.');
  }

  try {
    const followRef = db.collection('follows').doc(requestId);
    const followDoc = await followRef.get();

    if (!followDoc.exists) {
      throw new HttpsError('not-found', 'Solicitação não encontrada');
    }

    const followData = followDoc.data();

    // Verificar se a solicitação é para o usuário atual
    if (followData.followingId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Não autorizado a aceitar esta solicitação');
    }

    // Verificar se ainda está pendente
    if (followData.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Solicitação não está pendente');
    }

    const batch = db.batch();

    // Atualizar status para 'active'
    batch.update(followRef, {
      status: 'active',
      acceptedAt: serverTimestamp()
    });

    // Atualizar contadores
    batch.update(db.collection('profiles').doc(followData.followerId), {
      followingCount: admin.firestore.FieldValue.increment(1)
    });

    batch.update(db.collection('profiles').doc(followData.followingId), {
      followersCount: admin.firestore.FieldValue.increment(1)
    });

    // Criar atividade para o feed
    const activityRef = db.collection('activities').doc();
    batch.set(activityRef, {
      id: activityRef.id,
      userId: followData.followerId,
      type: 'user_followed',
      data: {
        followedUserId: followData.followingId,
        followedUserName: 'Usuário' // Pode ser melhorado buscando o nome real
      },
      isPublic: true,
      createdAt: serverTimestamp()
    });

    await batch.commit();

    return { success: true, message: 'Solicitação aceita com sucesso' };

  } catch (error) {
    logger.error('Erro ao aceitar solicitação de follow:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Rejeita uma solicitação de follow
 */
export const rejectFollowRequest = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  const { requestId } = request.data;

  if (!requestId) {
    throw new HttpsError('invalid-argument', 'ID da solicitação é obrigatório');
  }

  // Rate limiting
  if (!rateLimiter.isAllowed(`rejectFollowRequest:${request.auth?.uid}`, 30, 3600)) {
    throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente em alguns segundos.');
  }

  try {
    const followRef = db.collection('follows').doc(requestId);
    const followDoc = await followRef.get();

    if (!followDoc.exists) {
      throw new HttpsError('not-found', 'Solicitação não encontrada');
    }

    const followData = followDoc.data();

    // Verificar se a solicitação é para o usuário atual
    if (followData.followingId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Não autorizado a rejeitar esta solicitação');
    }

    // Verificar se ainda está pendente
    if (followData.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Solicitação não está pendente');
    }

    // Remover a solicitação
    await followRef.delete();

    return { success: true, message: 'Solicitação rejeitada com sucesso' };

  } catch (error) {
    logger.error('Erro ao rejeitar solicitação de follow:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Lista solicitações enviadas pelo usuário atual
 */
export const getSentFollowRequests = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  const data = request.data;
  const limit = Math.min(data.limit || 20, 50);
  const startAfter = data.startAfter;

  // Rate limiting
  if (!rateLimiter.isAllowed(`getSentFollowRequests:${request.auth?.uid}`, 50, 3600)) {
    throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente em alguns segundos.');
  }

  try {
    let query = db
      .collection('follows')
      .where('followerId', '==', request.auth.uid)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (startAfter) {
      const startAfterDoc = await db.collection('follows').doc(startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const followsSnapshot = await query.get();
    const sentRequests = [];

    for (const followDoc of followsSnapshot.docs) {
      const followData = followDoc.data();
      const targetProfileSnapshot = await db
        .collection('profiles')
        .doc(followData.followingId)
        .get();

      if (targetProfileSnapshot.exists) {
        const profileData = targetProfileSnapshot.data();
        sentRequests.push({
          id: followDoc.id,
          targetId: followData.followingId,
          targetName: profileData?.name,
          targetUsername: profileData?.username,
          targetAvatar: profileData?.avatar,
          followersCount: profileData?.followersCount || 0,
          requestedAt: followData.createdAt,
          status: followData.status
        });
      }
    }

    return {
      sentRequests,
      hasMore: followsSnapshot.docs.length === limit,
      lastDoc: followsSnapshot.docs.length > 0 ? followsSnapshot.docs[followsSnapshot.docs.length - 1].id : null
    };

  } catch (error) {
    logger.error('Erro ao buscar solicitações enviadas:', error);
    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});
