/**
 * UNIFIED SEED SCRIPT - PINUBI FUNCTIONS
 *
 * Este script combina todos os seeds em um só:
 * - Dados base do sistema (usuários, convites, etc.)
 * - Dados de lugares e geolocalização
 * - Dados completos do sistema de reviews
 * - Validação final de integridade
 *
 * Usage: npm run seed
 */

const admin = require("firebase-admin");
const { initializeApp: initializeClientApp } = require("firebase/app");
const {
  getAuth,
  createUserWithEmailAndPassword,
  connectAuthEmulator,
} = require("firebase/auth");
const {
  getFirestore: getClientFirestore,
  connectFirestoreEmulator,
} = require("firebase/firestore");
const { GeoFirestore } = require("geofirestore");

// Configurar Firebase Admin para emuladores
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";

// Inicializar Firebase Admin
const adminApp = admin.initializeApp({
  projectId: "demo-pinubi-functions",
});
const db = admin.firestore(adminApp);
const authAdmin = admin.auth(adminApp);

// Inicializar Firebase Client para usar createUserWithEmailAndPassword
const clientFirebaseConfig = {
  projectId: "demo-pinubi-functions",
  apiKey: "AIzaSyDemoApiKeyForEmulatorUsage123456789",
  authDomain: "demo-pinubi-functions.firebaseapp.com",
  storageBucket: "demo-pinubi-functions.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};

const clientApp = initializeClientApp(clientFirebaseConfig);
const clientAuth = getAuth(clientApp);
const clientDb = getClientFirestore(clientApp);

// Conectar aos emuladores
connectAuthEmulator(clientAuth, "http://localhost:9099");
connectFirestoreEmulator(clientDb, "localhost", 8080);
const geoFirestore = new GeoFirestore(db);

// ======================
// CORES PARA OUTPUT
// ======================

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.cyan}${"=".repeat(50)}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${"=".repeat(50)}${colors.reset}\n`);
}

// ======================
// FUNÇÕES AUXILIARES
// ======================

function generateUniqueCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForUserDocument(userId, maxAttempts = 6) {
  let userDoc = null;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    logInfo(
      `Verificando documento do usuário (tentativa ${attempts}/${maxAttempts})`
    );

    userDoc = await db.collection("users").doc(userId).get();

    if (userDoc.exists) {
      logSuccess("Documento criado pelo trigger!");
      return userDoc.data();
    } else {
      if (attempts < maxAttempts) {
        logInfo("Documento ainda não existe, aguardando mais 2 segundos...");
        await sleep(2000);
      }
    }
  }

  throw new Error(
    "Documento do usuário não foi criado pelo trigger após 12 segundos"
  );
}

async function clearExistingData() {
  logSection("LIMPEZA DE DADOS EXISTENTES");

  const collections = [
    "users",
    "profiles",
    "user-settings",
    "places",
    "lists",
    "listPlaces",
    "reviews",
    "userPlaceInteractions",
    "activities",
    "notifications",
    "follows",
    "matches",
    "votations",
    "purchases",
    "invites",
  ];

  for (const collectionName of collections) {
    try {
      const snapshot = await db.collection(collectionName).get();

      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        logSuccess(
          `Collection ${collectionName} limpa (${snapshot.size} docs removidos)`
        );
      } else {
        logInfo(`Collection ${collectionName} já vazia`);
      }
    } catch (error) {
      logWarning(
        `Erro ao limpar collection ${collectionName}: ${error.message}`
      );
    }
  }

  // Limpar usuários do Auth
  try {
    const userRecords = await authAdmin.listUsers();
    const deletePromises = userRecords.users.map((user) =>
      authAdmin.deleteUser(user.uid)
    );
    await Promise.all(deletePromises);
    logSuccess(`${userRecords.users.length} usuários removidos do Auth`);
  } catch (error) {
    logWarning(`Erro ao limpar Auth: ${error.message}`);
  }
}

// ======================
// SEED 1: USUÁRIOS BASE
// ======================

async function seedBaseUsers() {
  logSection("SEED 1: USUÁRIOS BASE");

  const baseUsers = [
    {
      uid: "test-admin",
      email: "admin@test.com",
      displayName: "Admin Teste",
      accountType: "premium",
      role: "admin",
      isFullyActivated: true,
    },
    {
      uid: "test-user-1",
      email: "user1@test.com",
      displayName: "João Silva",
      accountType: "free",
      role: "user",
      isFullyActivated: true,
    },
    {
      uid: "test-user-2",
      email: "user2@test.com",
      displayName: "Maria Santos",
      accountType: "premium",
      role: "user",
      isFullyActivated: true,
    },
    {
      uid: "test-user-3",
      email: "user3@test.com",
      displayName: "Ana Costa",
      accountType: "premium",
      role: "user",
      isFullyActivated: true,
    },
    {
      uid: "test-user-inactive",
      email: "inactive@test.com",
      displayName: "Pedro Inativo",
      accountType: "free",
      role: "user",
      isFullyActivated: false,
    },
  ];

  for (const userData of baseUsers) {
    try {
      // Usar Admin SDK para criar usuário com UID específico (como faz o sistema real)
      await authAdmin.createUser({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        password: "password123",
      });

      const userId = userData.uid;
      logSuccess(
        `Usuário ${userData.displayName} criado no Auth (UID: ${userId})`
      );

      // Aguardar um pouco
      await sleep(500);

      // Criar documento inicial do usuário (como faria o trigger onUserCreate)
      logInfo(`Criando documento inicial para ${userData.displayName}...`);
      await db
        .collection("users")
        .doc(userId)
        .set({
          // Campos básicos
          id: userId,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: "",
          accountType: "free", // Inicialmente free
          profileVisibility: "public",

          // Sistema de Convites e Ativação - ESTADO INICIAL
          inviteCode: generateUniqueCode(),
          maxInvites: 5,
          invitesUsed: 0,
          invitedBy: null,
          invitedUsers: [],

          // Estados de Validação e Ativação - EM ONBOARDING
          isValidated: false,
          isActive: false,
          onboardingComplete: false,
          validatedAt: null,

          // Métricas e Limites - ZERADOS
          listsCount: 0,
          placesCount: 0,
          aiCredits: 0,
          aiCreditsLastReset: null,
          votationsThisMonth: 0,

          // Configurações - BÁSICAS
          preferences: {
            categories: [],
            priceRange: [1, 4],
            dietaryRestrictions: [],
          },

          // Relacionamentos - VAZIOS
          following: [],
          followers: [],
          pendingFriendRequests: [],

          // Localização - VAZIA
          location: {
            country: "",
            state: "",
            city: "",
            coordinates: {
              lat: 0,
              lng: 0,
            },
          },

          // Timestamps
          createdAt: admin.firestore.Timestamp.now(),
          lastLoginAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });

      // Se o usuário deve estar totalmente ativado, atualizar o documento
      if (userData.isFullyActivated) {
        logInfo(`Ativando usuário ${userData.displayName}...`);

        // Atualizar com dados de usuário ativado
        await db
          .collection("users")
          .doc(userId)
          .update({
            role: userData.role,
            accountType: userData.accountType,
            isValidated: true,
            isActive: true,
            isFullyActivated: true,
            onboardingComplete: true,
            validatedAt: admin.firestore.Timestamp.now(),
            listsCount: 2,
            aiCredits: userData.accountType === "premium" ? 20 : 5,
            aiCreditsLastReset: admin.firestore.Timestamp.now(),
            preferences: {
              categories: ["japanese", "italian", "american"],
              dietaryRestrictions: [],
            },
            location: {
              country: "Brazil",
              state: "SP",
              city: "São Paulo",
              coordinates: {
                lat: -23.5505,
                lng: -46.6333,
              },
            },
            // GeoFirestore para buscas por proximidade
            geoLocation: {
              coordinates: new admin.firestore.GeoPoint(-23.5505, -46.6333),
            },
          });

        // Aguardar um pouco para o trigger onUserUpdate processar
        await sleep(1000);

        // Como o trigger não cria automaticamente, criar perfil e settings manualmente
        logInfo("Criando perfil e settings para usuário ativado...");

        // Criar perfil
        await db.collection("profiles").doc(userId).set({
          id: userId,
          userId: userId,
          displayName: userData.displayName,
          email: userData.email,
          isActive: true,
          profileComplete: true,
          followersCount: 0,
          followingCount: 0,
          listsCount: 2,
          placesCount: 0,
          reviewsCount: 0,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });

        // Criar settings
        await db
          .collection("user-settings")
          .doc(userId)
          .set({
            id: userId,
            userId: userId,
            notifications: {
              email: true,
              push: true,
              sms: false,
              newFollower: true,
              listPurchased: true,
              socialMatch: true,
              votation: true,
            },
            privacy: {
              profilePublic: true,
              showEmail: false,
              allowInvites: true,
            },
            theme: "light",
            language: "pt-BR",
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
          });

        logSuccess(
          `Usuário ${userData.displayName} totalmente ativado (perfil: ✅, settings: ✅)`
        );
      }
    } catch (error) {
      logError(
        `Erro ao criar usuário ${userData.displayName}: ${error.message}`
      );
    }
  }
}

// ======================
// SEED 2: REVIEWERS
// ======================

async function seedReviewUsers() {
  logSection("SEED 2: USUÁRIOS REVIEWERS");

  const reviewUsers = [
    {
      uid: "reviewer-1",
      email: "reviewer1@test.com",
      displayName: "Ana Santos",
      accountType: "premium",
      isFullyActivated: true,
    },
    {
      uid: "reviewer-2",
      email: "reviewer2@test.com",
      displayName: "Carlos Silva",
      accountType: "free",
      isFullyActivated: true,
    },
    {
      uid: "reviewer-3",
      email: "reviewer3@test.com",
      displayName: "Maria Oliveira",
      accountType: "premium",
      isFullyActivated: true,
    },
    {
      uid: "reviewer-4",
      email: "reviewer4@test.com",
      displayName: "João Costa",
      accountType: "free",
      isFullyActivated: true,
    },
  ];

  for (const userData of reviewUsers) {
    try {
      // Usar Admin SDK para criar reviewer com UID específico
      await authAdmin.createUser({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        password: "password123",
      });

      const userId = userData.uid;
      logSuccess(
        `Reviewer ${userData.displayName} criado no Auth (UID: ${userId})`
      );

      // Aguardar um pouco
      await sleep(500);

      // Criar documento inicial do usuário (como faria o trigger onUserCreate)
      logInfo(`Criando documento inicial para ${userData.displayName}...`);
      await db
        .collection("users")
        .doc(userId)
        .set({
          // Campos básicos
          id: userId,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: "",
          accountType: "free", // Inicialmente free
          profileVisibility: "public",

          // Sistema de Convites e Ativação - ESTADO INICIAL
          inviteCode: generateUniqueCode(),
          maxInvites: 5,
          invitesUsed: 0,
          invitedBy: null,
          invitedUsers: [],

          // Estados de Validação e Ativação - EM ONBOARDING
          isValidated: false,
          isActive: false,
          onboardingComplete: false,
          validatedAt: null,

          // Métricas e Limites - ZERADOS
          listsCount: 0,
          placesCount: 0,
          aiCredits: 0,
          aiCreditsLastReset: null,
          votationsThisMonth: 0,

          // Configurações - BÁSICAS
          preferences: {
            categories: [],
            priceRange: [1, 4],
            dietaryRestrictions: [],
          },

          // Relacionamentos - VAZIOS
          following: [],
          followers: [],
          pendingFriendRequests: [],

          // Localização - VAZIA
          location: {
            country: "",
            state: "",
            city: "",
            coordinates: {
              lat: 0,
              lng: 0,
            },
          },

          // Timestamps
          createdAt: admin.firestore.Timestamp.now(),
          lastLoginAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });

      // Ativar o reviewer
      logInfo(`Ativando reviewer ${userData.displayName}...`);

      // Atualizar com dados de reviewer ativado
      await db
        .collection("users")
        .doc(userId)
        .update({
          role: "user",
          accountType: userData.accountType,
          isValidated: true,
          isActive: true,
          isFullyActivated: true,
          onboardingComplete: true,
          validatedAt: admin.firestore.Timestamp.now(),
          listsCount: 2,
          aiCredits: userData.accountType === "premium" ? 20 : 5,
          aiCreditsLastReset: admin.firestore.Timestamp.now(),
          preferences: {
            categories: ["japanese", "italian", "american", "coffee"],
            dietaryRestrictions: [],
          },
          location: {
            country: "Brazil",
            state: "SP",
            city: "São Paulo",
            coordinates: {
              lat: -23.5505,
              lng: -46.6333,
            },
          },
          // GeoFirestore para buscas por proximidade
          geoLocation: {
            coordinates: new admin.firestore.GeoPoint(-23.5505, -46.6333),
          },
          following: ["test-admin"], // Seguem o admin
        });

      // Aguardar um pouco para o trigger onUserUpdate processar
      await sleep(1000);

      // Como o trigger não cria automaticamente, criar perfil e settings manualmente
      logInfo("Criando perfil e settings para reviewer ativado...");

      // Criar perfil
      await db.collection("profiles").doc(userId).set({
        id: userId,
        userId: userId,
        displayName: userData.displayName,
        email: userData.email,
        isActive: true,
        profileComplete: true,
        followersCount: 0,
        followingCount: 1, // Segue o admin
        listsCount: 2,
        placesCount: 0,
        reviewsCount: 0,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });

      // Criar settings
      await db
        .collection("user-settings")
        .doc(userId)
        .set({
          id: userId,
          userId: userId,
          notifications: {
            email: true,
            push: true,
            sms: false,
            newFollower: true,
            listPurchased: true,
            socialMatch: true,
            votation: true,
          },
          privacy: {
            profilePublic: true,
            showEmail: false,
            allowInvites: true,
          },
          theme: "light",
          language: "pt-BR",
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });

      logSuccess(
        `Reviewer ${userData.displayName} totalmente ativado (perfil: ✅, settings: ✅)`
      );
    } catch (error) {
      logError(
        `Erro ao criar reviewer ${userData.displayName}: ${error.message}`
      );
    }
  }
}

// ======================
// SEED 3: LUGARES
// ======================

async function seedPlaces() {
  logSection("SEED 3: LUGARES");

  const places = [
    {
      id: "place-sushi-1",
      name: "Sushi Yasuda",
      latitude: -23.5505,
      longitude: -46.6333,
      categories: ["japanese", "sushi", "restaurant"],
    },
    {
      id: "place-pizza-1",
      name: "Pizzaria Bella",
      latitude: -23.5507,
      longitude: -46.6335,
      categories: ["italian", "pizza", "restaurant"],
    },
    {
      id: "place-burger-1",
      name: "Burger House",
      latitude: -23.5503,
      longitude: -46.633,
      categories: ["american", "burger", "restaurant"],
    },
    {
      id: "place-coffee-1",
      name: "Café Central",
      latitude: -23.5508,
      longitude: -46.6338,
      categories: ["coffee", "cafe", "breakfast"],
    },
    {
      id: "place-test-geo",
      name: "Test Geo Place",
      latitude: -23.551,
      longitude: -46.634,
      categories: ["test", "geo", "location"],
    },
  ];

  for (const placeData of places) {
    try {
      // Use GeoFirestore to properly set the geohash and location data
      const geoCollection = geoFirestore.collection("places");

      const placeDoc = {
        id: placeData.id,

        googleData: {
          name: placeData.name,
          formatted_address: "São Paulo, SP, Brasil",
          rating: 4.0 + Math.random() * 1.0, // Rating entre 4.0 e 5.0
          user_ratings_total: Math.floor(Math.random() * 500) + 100,
          lastUpdated: admin.firestore.Timestamp.now(),
        },

        searchableText: `${placeData.name.toLowerCase()} ${placeData.categories.join(
          " "
        )}`,

        coordinates: new admin.firestore.GeoPoint(
          placeData.latitude,
          placeData.longitude
        ),

        addedBy: [],
        totalAdds: 0,
        categories: placeData.categories,

        averageRatings: {
          overall: 7.5 + Math.random() * 2.5, // Rating entre 7.5 e 10.0
          totalReviews: 2,
          food: 7.5 + Math.random() * 2.5,
        },

        socialMetrics: {},

        createdAt: admin.firestore.Timestamp.now(),
        lastGoogleSync: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now().toDate().toISOString(),
      };

      // Use GeoFirestore add method to automatically calculate geohash
      await geoCollection.doc(placeData.id).set(placeDoc);

      logSuccess(`Lugar ${placeData.name} criado com geohash automatico`);
    } catch (error) {
      logError(`Erro ao criar lugar ${placeData.name}: ${error.message}`);
    }
  }
}

// ======================
// SEED 4: REVIEWS
// ======================

async function seedReviews() {
  logSection("SEED 4: REVIEWS");

  const reviews = [
    // Reviews para Sushi Yasuda
    {
      userId: "reviewer-1",
      placeId: "place-sushi-1",
      rating: 9.2,
      reviewType: "food",
      wouldReturn: true,
      comment:
        "O melhor sushi que já comi! Peixe fresquíssimo e preparo impecável.",
      photos: [
        {
          url: "https://example.com/sushi1.jpg",
          thumbnail: "https://example.com/sushi1_thumb.jpg",
          size: 2048000,
          width: 1920,
          height: 1080,
        },
      ],
    },
    {
      userId: "reviewer-1",
      placeId: "place-sushi-1",
      rating: 8.5,
      reviewType: "service",
      wouldReturn: true,
      comment: "Atendimento excelente, garçons muito atenciosos.",
    },
    {
      userId: "reviewer-2",
      placeId: "place-sushi-1",
      rating: 8.8,
      reviewType: "food",
      wouldReturn: true,
      comment: "Sushi delicioso! Recomendo o combinado especial.",
    },
    {
      userId: "reviewer-3",
      placeId: "place-sushi-1",
      rating: 7.5,
      reviewType: "ambiance",
      wouldReturn: true,
      comment:
        "Ambiente agradável, mas um pouco barulhento nos fins de semana.",
    },

    // Reviews para Pizzaria Bella
    {
      userId: "reviewer-2",
      placeId: "place-pizza-1",
      rating: 8.0,
      reviewType: "food",
      wouldReturn: true,
      comment: "Pizza com massa fininha e ingredientes de qualidade.",
      photos: [
        {
          url: "https://example.com/pizza1.jpg",
          thumbnail: "https://example.com/pizza1_thumb.jpg",
          size: 1536000,
          width: 1600,
          height: 900,
        },
      ],
    },
    {
      userId: "reviewer-3",
      placeId: "place-pizza-1",
      rating: 7.8,
      reviewType: "food",
      wouldReturn: true,
      comment: "Boa pizza, mas já comi melhores. Preço justo.",
    },

    // Reviews para Burger House
    {
      userId: "reviewer-3",
      placeId: "place-burger-1",
      rating: 8.7,
      reviewType: "food",
      wouldReturn: true,
      comment: "Hambúrguer suculento com batatas crocantes!",
    },
    {
      userId: "reviewer-4",
      placeId: "place-burger-1",
      rating: 6.5,
      reviewType: "food",
      wouldReturn: false,
      comment: "Hambúrguer veio meio frio e demorou para chegar.",
    },

    // Reviews para Café Central
    {
      userId: "reviewer-4",
      placeId: "place-coffee-1",
      rating: 9.1,
      reviewType: "food",
      wouldReturn: true,
      comment: "Café especial excepcional! Torrados na hora.",
      photos: [
        {
          url: "https://example.com/coffee1.jpg",
          thumbnail: "https://example.com/coffee1_thumb.jpg",
          size: 1024000,
          width: 1200,
          height: 800,
        },
      ],
    },

    // Review adicional para Test Geo Place
    {
      userId: "reviewer-1",
      placeId: "place-test-geo",
      rating: 7.5,
      reviewType: "ambiance",
      wouldReturn: true,
      comment: "Local interessante para testes de geolocalização.",
    },
  ];

  for (let i = 0; i < reviews.length; i++) {
    const reviewData = reviews[i];

    try {
      const reviewRef = db.collection("reviews").doc();
      await reviewRef.set({
        id: reviewRef.id,
        userId: reviewData.userId,
        placeId: reviewData.placeId,
        rating: reviewData.rating,
        reviewType: reviewData.reviewType,
        wouldReturn: reviewData.wouldReturn,
        comment: reviewData.comment,
        photos: reviewData.photos || [],
        isVisited: true,
        visitDate: admin.firestore.Timestamp.now(),

        likes: Math.floor(Math.random() * 10),
        likedBy: [],

        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });

      logSuccess(
        `Review ${reviewData.reviewType} criada para ${reviewData.placeId}`
      );

      // Aguardar um pouco para não sobrecarregar
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      logError(`Erro ao criar review ${i + 1}: ${error.message}`);
    }
  }

  // Aguardar triggers processarem
  logInfo("Aguardando triggers processarem médias...");
  await new Promise((resolve) => setTimeout(resolve, 3000));
}

// ======================
// SEED 5: INTERAÇÕES USUÁRIO-LUGAR
// ======================

async function seedUserPlaceInteractions() {
  logSection("SEED 5: INTERAÇÕES USUÁRIO-LUGAR");

  const interactions = [
    {
      userId: "reviewer-1",
      placeId: "place-sushi-1",
      hasVisited: true,
      hasReviewed: true,
      isFavorite: true,
      wantToVisit: false,
      personalAverage: 8.5,
      totalReviews: 4,
      lastInteractionAt: admin.firestore.Timestamp.now(),
    },
    {
      userId: "reviewer-2",
      placeId: "place-pizza-1",
      hasVisited: true,
      hasReviewed: true,
      isFavorite: false,
      wantToVisit: false,
      personalAverage: 7.9,
      totalReviews: 2,
      lastInteractionAt: admin.firestore.Timestamp.now(),
    },
    {
      userId: "reviewer-3",
      placeId: "place-burger-1",
      hasVisited: true,
      hasReviewed: true,
      isFavorite: true,
      wantToVisit: false,
      personalAverage: 7.6,
      totalReviews: 2,
      lastInteractionAt: admin.firestore.Timestamp.now(),
    },
    {
      userId: "test-user-1",
      placeId: "place-coffee-1",
      hasVisited: false,
      hasReviewed: false,
      isFavorite: false,
      wantToVisit: true,
      personalAverage: 0,
      totalReviews: 0,
      lastInteractionAt: admin.firestore.Timestamp.now(),
    },
  ];

  for (const interaction of interactions) {
    try {
      const interactionRef = db.collection("userPlaceInteractions").doc();
      await interactionRef.set({
        id: interactionRef.id,
        userId: interaction.userId,
        placeId: interaction.placeId,
        hasVisited: interaction.hasVisited,
        hasReviewed: interaction.hasReviewed,
        isFavorite: interaction.isFavorite,
        wantToVisit: interaction.wantToVisit,
        personalAverage: interaction.personalAverage,
        totalReviews: interaction.totalReviews,
        visitCount: interaction.hasVisited ? 1 : 0,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        lastInteractionAt: interaction.lastInteractionAt,
      });

      logSuccess(
        `Interação criada: ${interaction.userId} <-> ${interaction.placeId}`
      );
    } catch (error) {
      logError(`Erro ao criar interação: ${error.message}`);
    }
  }
}

// ======================
// SEED 6: LISTAS E ATIVIDADES
// ======================

async function seedListsAndActivities() {
  logSection("SEED 6: LISTAS E ATIVIDADES");

  // Criar listas automáticas para usuários ativos
  const activeUsers = [
    "test-user-1",
    "test-user-2",
    "test-user-3",
    "reviewer-1",
    "reviewer-2",
    "reviewer-3",
    "reviewer-4",
  ];

  for (const userId of activeUsers) {
    try {
      // Lista "Quero Visitar"
      const wantToVisitRef = db.collection("lists").doc();
      await wantToVisitRef.set({
        id: wantToVisitRef.id,
        title: "Quero Visitar",
        emoji: "📍",
        description: "Lugares que quero conhecer",
        ownerId: userId,
        visibility: "private",
        editors: [],
        isMonetized: false,
        price: 0,
        purchasedBy: [],
        placesCount: 0,
        tags: [],
        category: "wishlist",
        isSystemList: false,
        isAutoGenerated: true,
        canDelete: false,
        canRename: false,
        autoListType: "want_to_visit",
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        regions: ["SP"],
      });

      // Lista "Favoritas"
      const favoritesRef = db.collection("lists").doc();
      await favoritesRef.set({
        id: favoritesRef.id,
        title: "Favoritas",
        emoji: "❤️",
        description: "Meus lugares favoritos",
        ownerId: userId,
        visibility: "private",
        editors: [],
        isMonetized: false,
        price: 0,
        purchasedBy: [],
        placesCount: 0,
        tags: [],
        category: "favorites",
        isSystemList: false,
        isAutoGenerated: true,
        canDelete: false,
        canRename: false,
        autoListType: "favorites",
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        regions: ["SP"],
      });

      logSuccess(`Listas automáticas criadas para ${userId}`);
    } catch (error) {
      logError(`Erro ao criar listas para ${userId}: ${error.message}`);
    }
  }

  // Criar algumas atividades de exemplo
  const activities = [
    {
      userId: "reviewer-1",
      type: "place_reviewed",
      data: { placeId: "place-sushi-1", rating: 9.2, reviewType: "food" },
    },
    {
      userId: "reviewer-2",
      type: "place_reviewed",
      data: { placeId: "place-pizza-1", rating: 8.0, reviewType: "food" },
    },
    {
      userId: "test-user-1",
      type: "user_invited",
      data: { invitedUserId: "reviewer-1" },
    },
  ];

  for (const activity of activities) {
    try {
      const activityRef = db.collection("activities").doc();
      await activityRef.set({
        id: activityRef.id,
        userId: activity.userId,
        type: activity.type,
        data: activity.data,
        isPublic: true,
        createdAt: admin.firestore.Timestamp.now(),
      });

      logSuccess(`Atividade ${activity.type} criada para ${activity.userId}`);
    } catch (error) {
      logError(`Erro ao criar atividade: ${error.message}`);
    }
  }
}

// ======================
// SEED 7: LIST PLACES
// ======================

async function seedListPlaces() {
  logSection("SEED 7: LUGARES NAS LISTAS");

  // Buscar algumas listas criadas para adicionar lugares
  const listsSnapshot = await db
    .collection("lists")
    .where("autoListType", "in", ["want_to_visit", "favorites"])
    .limit(6)
    .get();

  if (listsSnapshot.empty) {
    logWarning("Nenhuma lista encontrada para adicionar lugares");
    return;
  }

  // Lugares disponíveis
  const availablePlaces = [
    "place-sushi-1",
    "place-pizza-1", 
    "place-burger-1",
    "place-coffee-1",
    "place-test-geo"
  ];

  const users = [
    "test-user-1",
    "test-user-2", 
    "test-user-3",
    "reviewer-1",
    "reviewer-2"
  ];

  let listPlaceCount = 0;

  // Adicionar lugares em algumas listas (não todas)
  for (const listDoc of listsSnapshot.docs) {
    const listData = listDoc.data();
    
    // Só adicionar lugares em algumas listas (50% de chance)
    if (Math.random() > 0.5) continue;

    // Escolher 2-4 lugares aleatórios para esta lista
    const numPlaces = Math.floor(Math.random() * 3) + 2; // 2 a 4 lugares
    const shuffledPlaces = [...availablePlaces].sort(() => Math.random() - 0.5);
    const selectedPlaces = shuffledPlaces.slice(0, numPlaces);

    for (let i = 0; i < selectedPlaces.length; i++) {
      const placeId = selectedPlaces[i];
      
      try {
        const listPlaceRef = db.collection("listPlaces").doc();
        
        const listPlaceData = {
          listId: listData.id,
          placeId: placeId,
          addedBy: listData.ownerId,
          addedAt: admin.firestore.Timestamp.now(),
          order: i,
          personalNote: getRandomPersonalNote(),
          tags: getRandomTags(),
          createdAt: admin.firestore.Timestamp.now()
        };

        await listPlaceRef.set(listPlaceData);
        listPlaceCount++;

        // Atualizar contador da lista
        await db.collection("lists").doc(listData.id).update({
          placesCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.Timestamp.now()
        });

        // Atualizar métricas sociais do lugar
        await db.collection("places").doc(placeId).update({
          "socialMetrics.totalAdds": admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.Timestamp.now()
        });

      } catch (error) {
        logError(`Erro ao adicionar lugar ${placeId} à lista ${listData.id}: ${error.message}`);
      }
    }

    logSuccess(`${selectedPlaces.length} lugares adicionados à lista "${listData.title}" (${listData.ownerId})`);
  }

  logSuccess(`Total de ${listPlaceCount} relações listPlace criadas`);
}

// Funções auxiliares para dados aleatórios
function getRandomPersonalNote() {
  const notes = [
    "Quero muito visitar!",
    "Recomendação de amigo",
    "Vi no Instagram e parece incrível",
    "Lugar para levar a família",
    "Perfeito para um encontro",
    "Ambiente descontraído",
    "Comida autêntica",
    ""
  ];
  return notes[Math.floor(Math.random() * notes.length)];
}

function getRandomTags() {
  const allTags = [
    "romantic", "family", "friends", "business", "casual", 
    "expensive", "cheap", "authentic", "trendy", "cozy"
  ];
  
  // Retornar 0-3 tags aleatórias
  const numTags = Math.floor(Math.random() * 4);
  if (numTags === 0) return [];
  
  const shuffled = [...allTags].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numTags);
}

// ======================
// VALIDAÇÃO FINAL
// ======================

async function validateSeedData() {
  logSection("VALIDAÇÃO FINAL");

  const validations = [
    { collection: "users", expected: 9, description: "Usuários" },
    { collection: "places", expected: 5, description: "Lugares" },
    { collection: "reviews", expected: 10, description: "Reviews" },
    {
      collection: "lists",
      expected: 14,
      description: "Listas (2 por usuário ativo)",
    },
    { collection: "listPlaces", expected: 5, description: "Lugares nas listas" },
    { collection: "activities", expected: 3, description: "Atividades" },
  ];

  let allValid = true;

  for (const validation of validations) {
    try {
      const snapshot = await db.collection(validation.collection).get();
      const count = snapshot.size;

      if (count >= validation.expected) {
        logSuccess(
          `${validation.description}: ${count} (esperado: ${validation.expected}+)`
        );
      } else {
        logWarning(
          `${validation.description}: ${count} (esperado: ${validation.expected}+)`
        );
        allValid = false;
      }
    } catch (error) {
      logError(`Erro ao validar ${validation.description}: ${error.message}`);
      allValid = false;
    }
  }

  // Validar médias calculadas
  try {
    const placesWithReviews = await db
      .collection("places")
      .where("averageRatings.totalReviews", ">", 0)
      .get();

    if (placesWithReviews.size > 0) {
      logSuccess(`Lugares com médias calculadas: ${placesWithReviews.size}`);

      placesWithReviews.forEach((doc) => {
        const data = doc.data();
        console.log(
          `  • ${data.googleData.name}: ${data.averageRatings.overall} (${data.averageRatings.totalReviews} reviews)`
        );
      });
    } else {
      logWarning(
        "Nenhum lugar com médias calculadas - triggers podem não ter processado"
      );
    }
  } catch (error) {
    logError(`Erro ao validar médias: ${error.message}`);
  }

  return allValid;
}

// ======================
// FUNÇÃO PRINCIPAL
// ======================

async function runUnifiedSeed() {
  const startTime = Date.now();

  console.log(`${colors.bright}${colors.blue}`);
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║                                                    ║");
  console.log("║        🌱 UNIFIED SEED - PINUBI FUNCTIONS         ║");
  console.log("║                                                    ║");
  console.log("╚════════════════════════════════════════════════════╝");
  console.log(`${colors.reset}\n`);

  try {
    await clearExistingData();
    await seedBaseUsers();
    await seedReviewUsers();
    await seedPlaces();
    await seedReviews();
    await seedUserPlaceInteractions();
    await seedListsAndActivities();
    await seedListPlaces();

    const isValid = await validateSeedData();

    const duration = (Date.now() - startTime) / 1000;

    logSection("RESUMO FINAL");

    if (isValid) {
      logSuccess(`🎉 Seed executado com sucesso em ${duration}s!`);
      logInfo("📊 Dados criados:");
      console.log("   • 4 usuários base (incluindo admin)");
      console.log("   • 4 usuários reviewers");
      console.log("   • 5 lugares com geolocalização");
      console.log("   • 10 reviews com diferentes tipos e notas");
      console.log("   • 12 listas automáticas");
      console.log("   • Lugares adicionados em algumas listas");
      console.log("   • 3 atividades de exemplo");
      console.log("   • Médias calculadas automaticamente");
      console.log("");
      logInfo("🚀 Sistema pronto para testes!");
    } else {
      logWarning(`⚠️  Seed concluído com warnings em ${duration}s`);
      logInfo("Alguns dados podem não ter sido criados corretamente.");
    }
  } catch (error) {
    logError(`💥 Erro fatal durante seed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runUnifiedSeed()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Erro fatal:", error);
      process.exit(1);
    });
}

module.exports = {
  runUnifiedSeed,
  clearExistingData,
  seedBaseUsers,
  seedReviewUsers,
  seedPlaces,
  seedReviews,
  seedListsAndActivities,
  seedListPlaces,
  validateSeedData,
};
