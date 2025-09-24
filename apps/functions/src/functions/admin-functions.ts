import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { db, admin } from '../config/firebase';
import { serverTimestamp } from '../utils/helpers';

// ======================
// FUNCTIONS ADMINISTRATIVAS
// ======================

// Function para obter estatísticas gerais da plataforma
export const getSystemStats = onCall(async (request) => {
  // Verificar se é admin
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    // Verificar permissões de admin
    const adminDoc = await db.collection('users').doc(request.auth.uid).get();
    const adminData = adminDoc.data();

    if (!adminData || adminData.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Acesso negado - apenas administradores');
    }

    // Contar usuários totais
    const totalUsersSnapshot = await db.collection('users').count().get();

    // Contar usuários ativos
    const activeUsersSnapshot = await db.collection('users')
      .where('isActive', '==', true)
      .count()
      .get();

    // Contar usuários criados hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newUsersToday = await db.collection('users')
      .where('createdAt', '>=', today)
      .count()
      .get();

    // Contar notificações enviadas hoje
    const notificationsToday = await db.collection('notifications')
      .where('sentAt', '>=', today)
      .count()
      .get();

    const stats = {
      users: {
        total: totalUsersSnapshot.data().count,
        active: activeUsersSnapshot.data().count,
        newToday: newUsersToday.data().count
      },
      notifications: {
        sentToday: notificationsToday.data().count
      },
      generatedAt: new Date().toISOString(),
      generatedBy: request.auth.uid
    };

    logger.info('Estatísticas do sistema consultadas por:', request.auth.uid);
    return { success: true, stats };
  } catch (error) {
    logger.error('Erro ao obter estatísticas:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno ao obter estatísticas');
  }
});

// Function para obter logs de ações administrativas
export const getAdminActions = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    // Verificar permissões de admin
    const adminDoc = await db.collection('users').doc(request.auth.uid).get();
    const adminData = adminDoc.data();

    if (!adminData || adminData.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Acesso negado - apenas administradores');
    }

    const { limit = 50, startAfter } = request.data;

    // Construir query
    let query = db.collection('admin-actions')
      .orderBy('performedAt', 'desc')
      .limit(limit);

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    const snapshot = await query.get();
    const actions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      actions,
      hasMore: snapshot.docs.length === limit
    };
  } catch (error) {
    logger.error('Erro ao obter logs administrativos:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno ao obter logs');
  }
});

// Function para forçar logout de um usuário
export const forceLogout = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const { userId } = request.data;

    if (!userId) {
      throw new HttpsError('invalid-argument', 'ID do usuário é obrigatório');
    }

    // Verificar permissões de admin
    const adminDoc = await db.collection('users').doc(request.auth.uid).get();
    const adminData = adminDoc.data();

    if (!adminData || adminData.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Apenas administradores podem forçar logout');
    }

    // Revogar tokens do usuário
    await admin.auth().revokeRefreshTokens(userId);

    // Marcar no Firestore
    await db.collection('users').doc(userId).update({
      forcedLogoutAt: serverTimestamp(),
      forcedLogoutBy: request.auth.uid,
      updatedAt: serverTimestamp()
    });

    // Log da ação administrativa
    await db.collection('admin-actions').add({
      action: 'force-logout',
      targetUserId: userId,
      performedBy: request.auth.uid,
      performedAt: serverTimestamp()
    });

    logger.info(`Logout forçado para usuário ${userId} por ${request.auth.uid}`);
    return { success: true };
  } catch (error) {
    logger.error('Erro ao forçar logout:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno ao forçar logout');
  }
});

// Function para limpar dados de teste (apenas em desenvolvimento)
export const cleanupTestData = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    // Verificar permissões de admin
    const adminDoc = await db.collection('users').doc(request.auth.uid).get();
    const adminData = adminDoc.data();

    if (!adminData || adminData.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Apenas administradores podem executar limpeza');
    }

    // Verificar se não é ambiente de produção
    const projectId = process.env.GCLOUD_PROJECT;
    if (projectId && !projectId.includes('demo') && !projectId.includes('dev')) {
      throw new HttpsError('failed-precondition', 'Operação não permitida em ambiente de produção');
    }

    const { collections, confirmationPhrase } = request.data;

    if (confirmationPhrase !== 'DELETE_ALL_TEST_DATA') {
      throw new HttpsError('invalid-argument', 'Frase de confirmação incorreta');
    }

    const collectionsToClean = collections || ['test-users', 'test-data', 'temp-data'];
    let totalDeleted = 0;

    for (const collectionName of collectionsToClean) {
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef.get();

      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        totalDeleted += snapshot.docs.length;

        logger.info(`${snapshot.docs.length} documentos removidos da coleção ${collectionName}`);
      }
    }

    // Log da ação administrativa
    await db.collection('admin-actions').add({
      action: 'cleanup-test-data',
      performedBy: request.auth.uid,
      performedAt: serverTimestamp(),
      metadata: {
        collectionsCleanedUp: collectionsToClean,
        totalDocumentsDeleted: totalDeleted
      }
    });

    logger.info(`Limpeza de dados de teste concluída: ${totalDeleted} documentos removidos`);
    return { success: true, deletedCount: totalDeleted };
  } catch (error) {
    logger.error('Erro na limpeza de dados:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno na limpeza de dados');
  }
});
