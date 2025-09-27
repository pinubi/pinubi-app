import { ActivityEntity, ActivityInvitedData, ApiResponse, ListEntity, UserEntity, UserPublicProfile } from '@pinubi/types';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { auth, db } from '../config/firebase';
import { generateUniqueCode, rateLimiter } from '../utils/helpers';

/*
 * onCall
 */

/**
 * Inicializar novo usuário no Firestore após criação no Auth
 */
export const initializeNewUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const userId = request.auth.uid;

    if (!rateLimiter.isAllowed(`initialize_user_${userId}`, 3, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    const userDoc = await db.collection('users').doc(userId).get();

    if (userDoc.exists && userDoc.data()?.onboardingComplete !== undefined) {
      const userData = userDoc.data() as UserEntity;
      if (userData.onboardingComplete) {
        throw new HttpsError('failed-precondition', 'Usuário já completou o onboarding');
      }
    }

    const authUser = await auth.getUser(userId);

    logger.info(`Novo usuário criado no Auth: ${userId}`, {
      email: authUser.email,
      name: authUser.displayName
    });

    const userData: UserEntity = {
      id: userId,
      email: authUser.email || '',
      name: authUser.displayName || '',
      photo: authUser.photoURL || '',
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
      checkinsCount: 0,

      createdAt: new Date().toISOString(),
    };

    // Criar documento do usuário no Firestore
    await db.collection('users').doc(userId).set(userData);
    logger.info(`Documento do usuário criado no Firestore: ${userId}`);

    // NÃO criar listas automáticas ainda - só após validação do convite
    // NÃO criar perfil e settings ainda - só após ativação completa

    return { success: true } as ApiResponse<Partial<UserEntity>>;

  } catch (error) {
    logger.error(`Erro ao processar criação do usuário ${request.auth?.uid}:`, error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Buscar dados de um usuário
 * @param data.userId - ID do usuário a ser buscado
 */
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

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado');
    }

    const userData = userDoc.data() as UserEntity;

    if (userData.profileVisibility === 'private' && request.auth?.uid !== userId) {
      return {
        checkinsCount: userData.checkinsCount,
        listsCount: userData.listsCount,
        placesCount: userData.placesCount,
        id: userData.id,
        name: userData.name,
        photo: userData.photo
      } as UserPublicProfile
    }

    return {
      success: true,
      data: userData
    } as ApiResponse<UserEntity>;
  } catch (error) {
    logger.error('Erro ao buscar usuário:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno ao buscar dados');
  }
});

/**
 * Valida código de convite e ativa usuário
 * @param data.inviteCode - Código de convite para validação
 */
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
    const currentUserData = currentUserDoc.data() as UserEntity;

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
    const inviterData = inviterDoc.data() as UserEntity;

    if (inviterData.invitesUsed >= inviterData.maxInvites) {
      throw new HttpsError('resource-exhausted', 'Este código de convite já foi usado o máximo de vezes');
    }

    // ATIVAR USUÁRIO COMPLETAMENTE seguindo Database Schema
    const batch = db.batch();

    const now = new Date().toISOString();

    // 1. Atualizar dados do usuário (ativar e validar) - Database Schema completo
    const userUpdates: UserEntity = {
      ...currentUserData,
      isValidated: true,
      isActive: true,
      onboardingComplete: true,
      validatedAt: now,
      invitedBy: inviterDoc.id,
      listsCount: 2,
    };

    batch.update(db.collection('users').doc(userId), userUpdates as Partial<UserEntity>);

    const inviterUpdates: UserEntity = {
      ...inviterData,
      invitesUsed: inviterData.invitesUsed + 1,
      invitedUsers: [...(inviterData.invitedUsers || []), userId],
    };

    batch.update(inviterDoc.ref, inviterUpdates as Partial<UserEntity>);

    // Lista "Quero Visitar"
    const wantToVisitList: ListEntity = {
      id: `${userId}_want_to_visit`,
      title: "Quero Visitar",
      emoji: "🎯",
      description: "Lugares que quero conhecer",
      tags: [],
      ownerId: userId,
      visibility: "private",
      isAutoGenerated: true,
      placesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    batch.set(db.collection('lists').doc(`${userId}_want_to_visit`), wantToVisitList);

    // Lista "Favoritas"
    const favoritesList: ListEntity = {
      id: `${userId}_favorites`,
      title: "Favoritos",
      emoji: "⭐",
      description: "Meus lugares favoritos",
      ownerId: userId,
      visibility: "private",
      placesCount: 0,
      tags: [],
      isAutoGenerated: true,
      createdAt: now,
      updatedAt: now,
    };

    batch.set(db.collection('lists').doc(`${userId}_favorites`), favoritesList);

    // 6. Criar atividade para o convidador seguindo Database Schema
    const activityRef = db.collection('activities').doc();
    batch.set(activityRef, {
      id: activityRef.id,
      userId: inviterDoc.id,
      type: 'user_invited',
      data: {
        invitedUserId: userId,
        invitedUserName: currentUserData.name
      },
      createdAt: now
    } as ActivityEntity<ActivityInvitedData>);

    await batch.commit();

    logger.info(`Usuário ${userId} ativado com sucesso via convite de ${inviterDoc.id}`);

    return {
      success: true,
    };

  } catch (error) {
    logger.error('Erro ao validar convite e ativar usuário:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Atualiza perfil do usuário
 * @param data.name - Nome do usuário
 * @param data.photo - URL da foto do usuário
 */
export const updateUserProfile = onCall(async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    if (!rateLimiter.isAllowed(`update_profile_${request.auth.uid}`, 20, 3600)) {
      throw new HttpsError('resource-exhausted', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    const { name, photo } = request.data;
    const userId = request.auth.uid;

    // Buscar dados atuais do usuário
    const currentUserDoc = await db.collection('users').doc(userId).get();
    const currentUserData = currentUserDoc.data() as UserEntity;

    if (!currentUserData) {
      throw new HttpsError('not-found', 'Usuário não encontrado');
    }

    const updates: UserEntity = {
      ...currentUserData,
      name,
      photo
    };


    const batch = db.batch();

    // Atualizar no Firestore
    batch.update(db.collection('users').doc(userId), updates as Partial<UserEntity>);

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