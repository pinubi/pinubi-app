import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { db, messaging, storage, admin } from '../config/firebase';
import { serverTimestamp } from '../utils/helpers';

// ======================
// FUNCTIONS DE NOTIFICAÇÃO
// ======================

// Function para enviar notificação push para um usuário
export const sendNotificationToUser = onCall(async (request) => {
  try {
    const { userId, title, body, data = {} } = request.data;

    if (!userId || !title || !body) {
      throw new HttpsError('invalid-argument', 'userId, title e body são obrigatórios');
    }

    // Buscar token FCM do usuário
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.fcmToken) {
      throw new HttpsError('not-found', 'Token FCM não encontrado para este usuário');
    }

    // Verificar se o usuário quer receber notificações
    const settingsDoc = await db.collection('user-settings').doc(userId).get();
    const settings = settingsDoc.data();

    if (settings && !settings.notifications?.push) {
      logger.info(`Usuário ${userId} optou por não receber notificações push`);
      return { success: false, reason: 'user-disabled-notifications' };
    }

    // Enviar notificação
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        ...data,
        userId: userId,
        timestamp: Date.now().toString()
      },
      token: userData.fcmToken,
    };

    const response = await messaging.send(message);

    // Salvar notificação no histórico
    await db.collection('notifications').add({
      userId: userId,
      title: title,
      body: body,
      data: data,
      messageId: response,
      status: 'sent',
      sentAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    logger.info(`Notificação enviada para usuário ${userId}: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    logger.error('Erro ao enviar notificação:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno ao enviar notificação');
  }
});

// Function para enviar notificação em massa
export const sendBulkNotification = onCall(async (request) => {
  // Verificar se é admin
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    // Verificar permissões de admin
    const adminDoc = await db.collection('users').doc(request.auth.uid).get();
    const adminData = adminDoc.data();

    if (!adminData || adminData.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Apenas administradores podem enviar notificações em massa');
    }

    const { title, body, userIds, data = {} } = request.data;

    if (!title || !body) {
      throw new HttpsError('invalid-argument', 'title e body são obrigatórios');
    }

    let targetUsers = [];

    // Se não especificou userIds, enviar para todos os usuários ativos
    if (!userIds || userIds.length === 0) {
      const usersSnapshot = await db.collection('users')
        .where('isActive', '==', true)
        .where('fcmToken', '!=', null)
        .get();

      targetUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } else {
      // Buscar usuários específicos
      const userPromises = userIds.map((userId: string) =>
        db.collection('users').doc(userId).get()
      );
      const userDocs = await Promise.all(userPromises);

      targetUsers = userDocs
        .filter(doc => doc.exists && doc.data()?.isActive && doc.data()?.fcmToken)
        .map(doc => ({ id: doc.id, ...doc.data() }));
    }

    if (targetUsers.length === 0) {
      return { success: false, reason: 'no-valid-users' };
    }

    // Preparar mensagens
    const messages = targetUsers.map(user => ({
      notification: { title, body },
      data: {
        ...data,
        userId: user.id,
        timestamp: Date.now().toString()
      },
      token: user.fcmToken,
    }));

    // Enviar notificações em lote (máximo 500 por vez)
    const batchSize = 500;
    const batches = [];

    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(messages.slice(i, i + batchSize));
    }

    let totalSent = 0;
    let totalFailed = 0;

    for (const batch of batches) {
      try {
        const response = await messaging.sendEach(batch);
        totalSent += response.successCount;
        totalFailed += response.failureCount;

        // Log de erros específicos
        if (response.failureCount > 0) {
          response.responses.forEach((resp, index) => {
            if (!resp.success) {
              logger.error(`Erro ao enviar para ${targetUsers[index].id}:`, resp.error);
            }
          });
        }
      } catch (batchError) {
        logger.error('Erro no lote de notificações:', batchError);
        totalFailed += batch.length;
      }
    }

    // Salvar no histórico de notificações em massa
    await db.collection('bulk-notifications').add({
      title,
      body,
      data,
      targetUserIds: targetUsers.map(u => u.id),
      totalSent,
      totalFailed,
      sentBy: request.auth.uid,
      sentAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    logger.info(`Notificação em massa enviada: ${totalSent} sucesso, ${totalFailed} falhas`);
    return { success: true, sent: totalSent, failed: totalFailed };
  } catch (error) {
    logger.error('Erro ao enviar notificação em massa:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno ao enviar notificações');
  }
});

// Function para atualizar token FCM do usuário
export const updateFCMToken = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    const { fcmToken } = request.data;
    const userId = request.auth.uid;

    if (!fcmToken) {
      throw new HttpsError('invalid-argument', 'Token FCM é obrigatório');
    }

    // Atualizar token no documento do usuário
    await db.collection('users').doc(userId).update({
      fcmToken: fcmToken,
      fcmTokenUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    logger.info(`Token FCM atualizado para usuário: ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error('Erro ao atualizar token FCM:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Erro interno ao atualizar token');
  }
});

// ======================
// SCHEDULED FUNCTIONS
// ======================

// Function agendada para limpeza de notificações antigas (diário às 2h)
export const cleanupOldNotifications = onSchedule('0 2 * * *', async (event) => {
  try {
    // Remover notificações com mais de 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldNotificationsQuery = db.collection('notifications')
      .where('createdAt', '<', thirtyDaysAgo)
      .limit(500); // Limitar para não sobrecarregar

    const snapshot = await oldNotificationsQuery.get();

    if (snapshot.empty) {
      logger.info('Nenhuma notificação antiga encontrada para limpeza');
      return;
    }

    // Deletar em lote
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    logger.info(`${snapshot.docs.length} notificações antigas removidas`);
  } catch (error) {
    logger.error('Erro na limpeza de notificações:', error);
  }
});

// Function agendada para backup de dados (diário às 3h)
export const backupUserData = onSchedule('0 3 * * *', async (event) => {
  try {
    const bucket = storage.bucket();
    const timestamp = new Date().toISOString().split('T')[0];

    // Backup de usuários
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Backup de perfis
    const profilesSnapshot = await db.collection('profiles').get();
    const profiles = profilesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Criar arquivos de backup
    const usersBackup = bucket.file(`backups/${timestamp}/users.json`);
    const profilesBackup = bucket.file(`backups/${timestamp}/profiles.json`);

    await Promise.all([
      usersBackup.save(JSON.stringify(users, null, 2)),
      profilesBackup.save(JSON.stringify(profiles, null, 2))
    ]);

    logger.info(`Backup criado para ${timestamp}: ${users.length} usuários, ${profiles.length} perfis`);
  } catch (error) {
    logger.error('Erro no backup:', error);
  }
});

// Function agendada para relatório semanal (segunda-feira às 9h)
export const weeklyUserReport = onSchedule('0 9 * * 1', async (event) => {
  try {
    // Contar usuários ativos
    const activeUsersSnapshot = await db.collection('users')
      .where('isActive', '==', true)
      .get();

    // Contar novos usuários da semana passada
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const newUsersSnapshot = await db.collection('users')
      .where('createdAt', '>=', oneWeekAgo)
      .get();

    // Contar notificações enviadas na semana
    const notificationsSnapshot = await db.collection('notifications')
      .where('sentAt', '>=', oneWeekAgo)
      .get();

    const report = {
      period: {
        from: oneWeekAgo.toISOString(),
        to: new Date().toISOString()
      },
      stats: {
        totalActiveUsers: activeUsersSnapshot.size,
        newUsersThisWeek: newUsersSnapshot.size,
        notificationsSent: notificationsSnapshot.size
      },
      generatedAt: serverTimestamp()
    };

    // Salvar relatório
    await db.collection('reports').doc(`weekly-${new Date().toISOString().split('T')[0]}`).set(report);

    logger.info('Relatório semanal gerado:', report.stats);
  } catch (error) {
    logger.error('Erro ao gerar relatório semanal:', error);
  }
});
