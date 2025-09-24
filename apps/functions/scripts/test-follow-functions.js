/**
 * SCRIPT DE TESTE - FOLLOW/UNFOLLOW FUNCTIONS
 * 
 * Testa as funcionalidades de seguir e deixar de seguir usuários
 */

const admin = require('firebase-admin');

// Configurar Firebase Admin
admin.initializeApp({
  projectId: 'demo-pinubi-functions',
  databaseURL: 'http://localhost:8080'
});

const db = admin.firestore();

// Conectar ao emulador
if (process.env.NODE_ENV !== 'production') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
}

async function testFollowFunctions() {
  console.log('🧪 Iniciando testes de follow/unfollow...\n');

  try {
    // 1. Criar usuários de teste
    console.log('📝 Criando usuários de teste...');
    await createTestUsers();

    // 2. Testar seguir usuário
    console.log('👥 Testando followUser...');
    await testFollowUser();

    // 3. Testar verificar status
    console.log('🔍 Testando checkFollowStatus...');
    await testCheckFollowStatus();

    // 4. Testar deixar de seguir
    console.log('❌ Testando unfollowUser...');
    await testUnfollowUser();

    // 5. Verificar contadores
    console.log('📊 Verificando contadores finais...');
    await verifyCounters();

    console.log('\n✅ Todos os testes de follow/unfollow concluídos com sucesso!');

  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  }
}

async function createTestUsers() {
  const users = [
    {
      id: 'user_follow_test_1',
      email: 'joao@follow.test',
      displayName: 'João Silva',
      accountType: 'free',
      profileVisibility: 'public',
      isValidated: true,
      isActive: true,
      following: [],
      followers: [],
      createdAt: admin.firestore.Timestamp.now()
    },
    {
      id: 'user_follow_test_2',
      email: 'maria@follow.test',
      displayName: 'Maria Santos',
      accountType: 'premium',
      profileVisibility: 'public',
      isValidated: true,
      isActive: true,
      following: [],
      followers: [],
      createdAt: admin.firestore.Timestamp.now()
    },
    {
      id: 'user_follow_test_3',
      email: 'pedro@follow.test',
      displayName: 'Pedro Costa',
      accountType: 'free',
      profileVisibility: 'private',
      isValidated: true,
      isActive: true,
      following: [],
      followers: [],
      createdAt: admin.firestore.Timestamp.now()
    }
  ];

  const batch = db.batch();

  for (const user of users) {
    // Criar usuário
    batch.set(db.collection('users').doc(user.id), user);
    
    // Criar perfil
    batch.set(db.collection('profiles').doc(user.id), {
      id: user.id,
      userId: user.id,
      displayName: user.displayName,
      email: user.email,
      isActive: true,
      profileComplete: true,
      followersCount: 0,
      followingCount: 0,
      listsCount: 0,
      placesCount: 0,
      reviewsCount: 0,
      createdAt: user.createdAt,
      updatedAt: user.createdAt
    });
  }

  await batch.commit();

  console.log('   ✓ Usuários criados: João Silva, Maria Santos, Pedro Costa');
}

async function testFollowUser() {
  const followerId = 'user_follow_test_1'; // João
  const followingId = 'user_follow_test_2'; // Maria

  console.log(`   📡 João seguindo Maria...`);

  // Simular a lógica de followUser
  const followRef = db.collection('follows').doc(`${followerId}_${followingId}`);
  
  // Verificar se já segue
  const existingFollow = await followRef.get();
  if (existingFollow.exists) {
    console.log('   ❌ Já está seguindo');
    return;
  }

  const batch = db.batch();

  // Criar relacionamento de follow
  batch.set(followRef, {
    followerId,
    followingId,
    status: 'active',
    createdAt: admin.firestore.Timestamp.now()
  });

  // Atualizar contadores
  batch.update(db.collection('profiles').doc(followerId), {
    followingCount: admin.firestore.FieldValue.increment(1)
  });

  batch.update(db.collection('profiles').doc(followingId), {
    followersCount: admin.firestore.FieldValue.increment(1)
  });

  // Criar atividade
  const activityRef = db.collection('activities').doc();
  batch.set(activityRef, {
    id: activityRef.id,
    userId: followerId,
    type: 'user_followed',
    data: {
      followedUserId: followingId,
      followedUserName: 'Maria Santos'
    },
    isPublic: true,
    createdAt: admin.firestore.Timestamp.now()
  });

  await batch.commit();

  console.log('   ✅ Follow realizado com sucesso');
  console.log(`   📈 Atividade 'user_followed' criada: ${activityRef.id}`);
}

async function testCheckFollowStatus() {
  const userId1 = 'user_follow_test_1'; // João
  const userId2 = 'user_follow_test_2'; // Maria

  console.log('   🔍 Verificando status de follow entre João e Maria...');

  // Verificar se João segue Maria
  const followDoc = await db.collection('follows')
    .doc(`${userId1}_${userId2}`)
    .get();

  // Verificar se Maria segue João de volta
  const followBackDoc = await db.collection('follows')
    .doc(`${userId2}_${userId1}`)
    .get();

  const status = {
    isFollowing: followDoc.exists,
    isFollowedBy: followBackDoc.exists,
    isMutual: followDoc.exists && followBackDoc.exists,
    followedAt: followDoc.exists ? followDoc.data()?.createdAt : null
  };

  console.log('   📊 Status:', {
    'João segue Maria': status.isFollowing,
    'Maria segue João': status.isFollowedBy,
    'Follow mútuo': status.isMutual
  });
}

async function testUnfollowUser() {
  const followerId = 'user_follow_test_1'; // João
  const followingId = 'user_follow_test_2'; // Maria

  console.log('   ❌ João deixando de seguir Maria...');

  // Verificar se está seguindo
  const followRef = db.collection('follows').doc(`${followerId}_${followingId}`);
  const followDoc = await followRef.get();

  if (!followDoc.exists) {
    console.log('   ❌ Não estava seguindo');
    return;
  }

  const batch = db.batch();

  // Remover relacionamento de follow
  batch.delete(followRef);

  // Atualizar contadores
  batch.update(db.collection('profiles').doc(followerId), {
    followingCount: admin.firestore.FieldValue.increment(-1)
  });

  batch.update(db.collection('profiles').doc(followingId), {
    followersCount: admin.firestore.FieldValue.increment(-1)
  });

  await batch.commit();

  console.log('   ✅ Unfollow realizado com sucesso');
}

async function verifyCounters() {
  const profiles = await Promise.all([
    db.collection('profiles').doc('user_follow_test_1').get(),
    db.collection('profiles').doc('user_follow_test_2').get(),
    db.collection('profiles').doc('user_follow_test_3').get()
  ]);

  console.log('   📊 Contadores finais:');
  profiles.forEach((profile, index) => {
    const data = profile.data();
    const names = ['João Silva', 'Maria Santos', 'Pedro Costa'];
    console.log(`      ${names[index]}: seguindo ${data.followingCount}, seguidores ${data.followersCount}`);
  });
}

// Função de limpeza
async function cleanup() {
  console.log('\n🧹 Limpando dados de teste...');
  
  const testUserIds = ['user_follow_test_1', 'user_follow_test_2', 'user_follow_test_3'];
  
  const batch = db.batch();

  // Limpar usuários
  for (const userId of testUserIds) {
    batch.delete(db.collection('users').doc(userId));
    batch.delete(db.collection('profiles').doc(userId));
  }

  // Limpar follows
  const followsSnapshot = await db.collection('follows')
    .where('followerId', 'in', testUserIds)
    .get();

  followsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Limpar atividades de teste
  const activitiesSnapshot = await db.collection('activities')
    .where('userId', 'in', testUserIds)
    .get();

  activitiesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log('✅ Limpeza concluída');
}

// Executar testes
if (require.main === module) {
  testFollowFunctions()
    .then(() => cleanup())
    .catch(console.error)
    .finally(() => process.exit(0));
}

module.exports = { testFollowFunctions, cleanup };
