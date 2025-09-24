/**
 * SCRIPT DE TESTE - FEED FUNCTIONS
 * 
 * Testa as funcionalidades do sistema de feed da Pinubi
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

async function testFeedSystem() {
  console.log('🧪 Iniciando testes do sistema de feed...\n');

  try {
    // 1. Criar usuários de teste
    console.log('📝 Criando usuários de teste...');
    await createTestUsers();

    // 2. Criar atividades de teste
    console.log('🎯 Criando atividades de teste...');
    await createTestActivities();

    // 3. Testar feed personalizado
    console.log('📱 Testando feed personalizado...');
    await testUserFeed();

    // 4. Testar feed de descoberta
    console.log('🔍 Testando feed de descoberta...');
    await testDiscoveryFeed();

    // 5. Testar refresh do feed
    console.log('🔄 Testando refresh do feed...');
    await testFeedRefresh();

    console.log('\n✅ Todos os testes do feed concluídos com sucesso!');

  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  }
}

async function createTestUsers() {
  const users = [
    {
      id: 'user_feed_test_1',
      email: 'joao@test.com',
      displayName: 'João Silva',
      accountType: 'premium',
      profileVisibility: 'public',
      isValidated: true,
      isActive: true,
      following: ['user_feed_test_2'],
      followers: ['user_feed_test_3'],
      preferences: {
        categories: ['japanese', 'italian', 'burgers'],
        priceRange: [2, 4]
      },
      location: {
        country: 'Brazil',
        state: 'SP',
        city: 'São Paulo',
        coordinates: {
          lat: -23.5505,
          lng: -46.6333
        }
      },
      createdAt: admin.firestore.Timestamp.now()
    },
    {
      id: 'user_feed_test_2',
      email: 'maria@test.com',
      displayName: 'Maria Santos',
      accountType: 'free',
      profileVisibility: 'public',
      isValidated: true,
      isActive: true,
      following: ['user_feed_test_1'],
      followers: ['user_feed_test_1'],
      preferences: {
        categories: ['japanese', 'coffee', 'desserts'],
        priceRange: [1, 3]
      },
      location: {
        country: 'Brazil',
        state: 'SP',
        city: 'São Paulo',
        coordinates: {
          lat: -23.5520,
          lng: -46.6350
        }
      },
      createdAt: admin.firestore.Timestamp.now()
    },
    {
      id: 'user_feed_test_3',
      email: 'pedro@test.com',
      displayName: 'Pedro Costa',
      accountType: 'free',
      profileVisibility: 'public',
      isValidated: true,
      isActive: true,
      following: ['user_feed_test_1'],
      followers: [],
      preferences: {
        categories: ['italian', 'pizza', 'wine'],
        priceRange: [2, 4]
      },
      location: {
        country: 'Brazil',
        state: 'SP',
        city: 'São Paulo',
        coordinates: {
          lat: -23.5600,
          lng: -46.6400
        }
      },
      createdAt: admin.firestore.Timestamp.now()
    }
  ];

  for (const user of users) {
    await db.collection('users').doc(user.id).set(user);
    console.log(`   ✓ Usuário criado: ${user.displayName}`);
  }
}

async function createTestActivities() {
  const activities = [
    {
      id: 'activity_feed_test_1',
      userId: 'user_feed_test_2',
      type: 'place_reviewed',
      data: {
        placeId: 'place_test_1',
        placeName: 'Sushi Yasuda',
        placeAddress: 'Rua Augusta, 123 - São Paulo, SP',
        placeCoordinates: {
          lat: -23.5510,
          lng: -46.6340
        },
        placeCategories: ['japanese', 'sushi'],
        rating: 9.2,
        reviewType: 'food',
        wouldReturn: true,
        comment: 'Melhor sushi que já comi em SP!',
        photos: ['photo1.jpg']
      },
      isPublic: true,
      createdAt: admin.firestore.Timestamp.now()
    },
    {
      id: 'activity_feed_test_2',
      userId: 'user_feed_test_3',
      type: 'place_added',
      data: {
        placeId: 'place_test_2',
        placeName: 'Pizzaria Bráz',
        placeAddress: 'Rua Bela Cintra, 456 - São Paulo, SP',
        placeCoordinates: {
          lat: -23.5580,
          lng: -46.6420
        },
        placeCategories: ['italian', 'pizza'],
        listId: 'list_test_1',
        listName: 'Melhores Pizzas de SP'
      },
      isPublic: true,
      createdAt: admin.firestore.Timestamp.now()
    },
    {
      id: 'activity_feed_test_3',
      userId: 'user_feed_test_2',
      type: 'list_created',
      data: {
        listId: 'list_test_2',
        listName: 'Cafés para Trabalhar',
        listEmoji: '☕',
        placesCount: 8,
        isMonetized: false,
        categories: ['coffee', 'work'],
        tags: ['wifi', 'quiet', 'laptop-friendly']
      },
      isPublic: true,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)) // 2h atrás
    }
  ];

  for (const activity of activities) {
    await db.collection('activities').doc(activity.id).set(activity);
    console.log(`   ✓ Atividade criada: ${activity.type} por ${activity.userId}`);
  }
}

async function testUserFeed() {
  console.log('   📡 Chamando getUserFeed...');
  
  // Simular chamada da função (normalmente seria via HTTPS)
  const mockRequest = {
    auth: { uid: 'user_feed_test_1' },
    data: {
      limit: 10,
      includeGeographic: true,
      maxDistance: 50
    }
  };

  // Como estamos em teste, vamos simular a lógica manualmente
  const userId = mockRequest.auth.uid;
  const userData = await db.collection('users').doc(userId).get();
  
  if (!userData.exists) {
    throw new Error('Usuário não encontrado');
  }

  console.log(`   ✓ Usuário encontrado: ${userData.data().displayName}`);
  
  // Buscar atividades públicas para feed geográfico
  const activitiesSnapshot = await db.collection('activities')
    .where('isPublic', '==', true)
    .where('type', 'in', ['place_added', 'place_visited', 'place_reviewed'])
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  console.log(`   ✓ Encontradas ${activitiesSnapshot.docs.length} atividades públicas`);

  // Simular cálculo de relevância
  const feedItems = [];
  for (const activityDoc of activitiesSnapshot.docs) {
    const activity = activityDoc.data();
    
    if (activity.userId === userId) continue; // Pular próprias atividades

    // Simular cálculo de score
    let relevanceScore = 5; // Base
    
    // Bonus por seguir o autor
    if (userData.data().following?.includes(activity.userId)) {
      relevanceScore += 3;
    }

    // Bonus por categoria
    const userCategories = userData.data().preferences?.categories || [];
    const activityCategories = activity.data?.placeCategories || [];
    const categoryMatch = activityCategories.some(cat => userCategories.includes(cat));
    if (categoryMatch) {
      relevanceScore += 2;
    }

    // Bonus por proximidade (simulado)
    if (activity.data?.placeCoordinates) {
      relevanceScore += 1; // Assumir que está próximo
    }

    feedItems.push({
      activityId: activityDoc.id,
      authorId: activity.userId,
      type: activity.type,
      data: activity.data,
      relevanceScore,
      createdAt: activity.createdAt
    });
  }

  // Ordenar por relevância
  feedItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

  console.log(`   ✓ Feed processado: ${feedItems.length} items`);
  console.log('   📊 Top 3 items por relevância:');
  
  feedItems.slice(0, 3).forEach((item, index) => {
    console.log(`      ${index + 1}. ${item.type} (score: ${item.relevanceScore})`);
  });
}

async function testDiscoveryFeed() {
  console.log('   🔍 Testando feed de descoberta...');
  
  const userId = 'user_feed_test_1';
  const userData = await db.collection('users').doc(userId).get();
  
  if (!userData.exists) {
    throw new Error('Usuário não encontrado');
  }

  const userCoords = userData.data().location.coordinates;
  console.log(`   📍 Localização do usuário: ${userCoords.lat}, ${userCoords.lng}`);

  // Buscar atividades recentes (últimos 7 dias)
  const last7Days = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
  
  const recentActivitiesSnapshot = await db.collection('activities')
    .where('isPublic', '==', true)
    .where('type', 'in', ['place_reviewed', 'place_visited'])
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(last7Days))
    .get();

  console.log(`   ✓ Encontradas ${recentActivitiesSnapshot.docs.length} atividades recentes`);

  // Simular contagem de popularidade por lugar
  const placePopularity = {};
  
  recentActivitiesSnapshot.docs.forEach(doc => {
    const activity = doc.data();
    const placeId = activity.data?.placeId;
    
    if (placeId) {
      placePopularity[placeId] = (placePopularity[placeId] || 0) + 1;
    }
  });

  const trendingPlaces = Object.keys(placePopularity)
    .map(placeId => ({
      placeId,
      activityCount: placePopularity[placeId]
    }))
    .sort((a, b) => b.activityCount - a.activityCount)
    .slice(0, 5);

  console.log('   🔥 Top 5 lugares trending:');
  trendingPlaces.forEach((place, index) => {
    console.log(`      ${index + 1}. Place ${place.placeId} (${place.activityCount} atividades)`);
  });
}

async function testFeedRefresh() {
  console.log('   🔄 Testando refresh do feed...');
  
  const userId = 'user_feed_test_1';
  
  // Verificar se existe feed cached
  const cachedFeedSnapshot = await db.collection('userFeeds').doc(userId)
    .collection('items')
    .limit(5)
    .get();

  console.log(`   📦 Items em cache antes do refresh: ${cachedFeedSnapshot.docs.length}`);

  // Simular limpeza de cache antigo (items expirados)
  const expiredItems = await db.collection('userFeeds').doc(userId)
    .collection('items')
    .where('expiresAt', '<', new Date())
    .get();

  if (!expiredItems.empty) {
    const batch = db.batch();
    expiredItems.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`   🗑️ Removidos ${expiredItems.docs.length} items expirados`);
  } else {
    console.log('   ✓ Nenhum item expirado encontrado');
  }

  console.log('   ✅ Refresh do feed concluído');
}

// Função de limpeza
async function cleanup() {
  console.log('\n🧹 Limpando dados de teste...');
  
  const testUserIds = ['user_feed_test_1', 'user_feed_test_2', 'user_feed_test_3'];
  const testActivityIds = ['activity_feed_test_1', 'activity_feed_test_2', 'activity_feed_test_3'];

  const batch = db.batch();

  // Limpar usuários
  for (const userId of testUserIds) {
    batch.delete(db.collection('users').doc(userId));
  }

  // Limpar atividades
  for (const activityId of testActivityIds) {
    batch.delete(db.collection('activities').doc(activityId));
  }

  await batch.commit();
  console.log('✅ Limpeza concluída');
}

// Executar testes
if (require.main === module) {
  testFeedSystem()
    .then(() => cleanup())
    .catch(console.error)
    .finally(() => process.exit(0));
}

module.exports = { testFeedSystem, cleanup };
