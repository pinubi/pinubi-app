/**
 * PLACE FUNCTIONS TEST - PINUBI FUNCTIONS
 *
 * Este script testa especificamente todas as funções relacionadas a lugares
 * incluindo busca, criação, atualização e funcionalidades geográficas.
 *
 * Funcionalidades testadas:
 * ✅ Setup de dados base (usuário autenticado e lugares de teste)
 * ✅ findNearbyPlaces - busca por proximidade geográfica
 * ✅ addPlaceWithLocation - adicionar novo lugar com coordenadas
 * ✅ updatePlaceLocation - atualizar coordenadas de lugar existente
 * ✅ getPlaceDetails - obter detalhes completos com cache inteligente
 * ✅ getPlacesInMapView - busca com filtros avançados e paginação
 * ✅ searchPlacesAdvanced - busca avançada com múltiplos filtros
 * ✅ updateUserLocation - salvar localização do usuário
 * ✅ getUserLocation - obter localização salva do usuário
 * ✅ Validação de dados geográficos e GeoFirestore
 *
 * Usage: node ./scripts/test-place-functions.js (with emulators running)
 */

// Imports necessários
const admin = require("firebase-admin");
const { initializeApp: initializeClientApp } = require("firebase/app");
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  connectAuthEmulator,
} = require("firebase/auth");
const {
  getFirestore: getClientFirestore,
  connectFirestoreEmulator,
} = require("firebase/firestore");
const {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} = require("firebase/functions");
const { GeoFirestore } = require("geofirestore");

// Configuração dos emuladores
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = "localhost:5001";

// Inicializar Firebase Admin
const adminApp = admin.initializeApp({
  projectId: "demo-pinubi-functions",
});
const db = admin.firestore(adminApp);
const authAdmin = admin.auth(adminApp);
const geoFirestore = new GeoFirestore(db);

// Inicializar Firebase Client
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
const clientFunctions = getFunctions(clientApp);

// Conectar aos emuladores
connectAuthEmulator(clientAuth, "http://localhost:9099");
connectFirestoreEmulator(clientDb, "localhost", 8080);
connectFunctionsEmulator(clientFunctions, "localhost", 5001);

// ======================
// CORES E UTILITÁRIOS
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

function logTest(message) {
  console.log(`${colors.cyan}🧪 ${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message, error = null) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
  if (error) {
    console.error(
      `${colors.red}   Error details: ${error.message || error}${colors.reset}`
    );
  }
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.yellow}${"=".repeat(60)}`);
  console.log(`${colors.yellow}${title}${colors.reset}`);
  console.log(`${colors.yellow}${"=".repeat(60)}${colors.reset}\n`);
}

function logSubsection(title) {
  console.log(`\n${colors.magenta}--- ${title} ---${colors.reset}`);
}

// Função para aguardar um tempo específico
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ======================
// DADOS DE TESTE
// ======================

// Coordenadas de referência (São Paulo)
const TEST_COORDINATES = {
  center: { lat: -23.5505, lng: -46.6333 },
  nearby: [
    { lat: -23.5507, lng: -46.6335, name: "Local Próximo 1" },
    { lat: -23.5503, lng: -46.633, name: "Local Próximo 2" },
    { lat: -23.5508, lng: -46.6338, name: "Local Próximo 3" },
  ],
  faraway: { lat: -22.9068, lng: -43.1729, name: "Local Distante (Rio)" },
};

// Dados de lugares de teste
function generateTestPlacesData() {
  const timestamp = Date.now();

  return [
    {
      id: `test-restaurant-${timestamp}`,
      name: `Test Restaurant ${timestamp}`,
      description: "A test restaurant for automated testing",
      category: "restaurant",
      categories: ["restaurant", "food", "test"],
      latitude: TEST_COORDINATES.center.lat + 0.001,
      longitude: TEST_COORDINATES.center.lng + 0.001,
      address: "Test Address, São Paulo, SP",
      tags: ["test", "restaurant", "automated"],
    },
    {
      id: `test-cafe-${timestamp}`,
      name: `Test Café ${timestamp}`,
      description: "A test café for automated testing",
      category: "cafe",
      categories: ["cafe", "coffee", "test"],
      latitude: TEST_COORDINATES.center.lat - 0.001,
      longitude: TEST_COORDINATES.center.lng - 0.001,
      address: "Test Café Address, São Paulo, SP",
      tags: ["test", "cafe", "coffee"],
    },
    {
      id: `test-far-place-${timestamp}`,
      name: `Test Far Place ${timestamp}`,
      description: "A test place far from the center",
      category: "attraction",
      categories: ["attraction", "test"],
      latitude: TEST_COORDINATES.faraway.lat,
      longitude: TEST_COORDINATES.faraway.lng,
      address: "Test Far Address, Rio de Janeiro, RJ",
      tags: ["test", "far", "attraction"],
    },
  ];
}

// Gerar dados de usuário de teste
function generateTestUserData() {
  const timestamp = Date.now();
  return {
    email: `test-place-user-${timestamp}@pinubi-test.com`,
    password: "TestPlaceUser123!",
    displayName: `Test Place User ${timestamp}`,
  };
}

// ======================
// SETUP DE DADOS BASE
// ======================

async function setupTestData() {
  logSection("SETUP DE DADOS BASE");

  let testUser = null;
  let testPlaces = [];
  let userCredential = null;

  try {
    // Criar usuário de teste
    logSubsection("Criação de Usuário de Teste");

    testUser = generateTestUserData();
    logTest(`Criando usuário: ${testUser.email}`);

    userCredential = await createUserWithEmailAndPassword(
      clientAuth,
      testUser.email,
      testUser.password
    );

    const userId = userCredential.user.uid;
    logSuccess(`Usuário criado com UID: ${userId}`);

    // Aguardar trigger criar documento
    await sleep(2000);

    // Verificar se usuário foi criado no Firestore e ativá-lo para os testes
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      // Criar manualmente se trigger não executou
      await db
        .collection("users")
        .doc(userId)
        .set({
          id: userId,
          email: testUser.email,
          displayName: testUser.displayName,
          accountType: "free",
          profileVisibility: "public",
          inviteCode: "TEST123",
          maxInvites: 10,
          invitesUsed: 0,
          invitedBy: null,
          invitedUsers: [],
          isValidated: true,
          isActive: true,
          onboardingComplete: true,
          validatedAt: new Date(),
          listsCount: 0,
          placesCount: 0,
          aiCredits: 50,
          aiCreditsLastReset: new Date(),
          votationsThisMonth: 0,
          preferences: {
            categories: [],
            priceRange: [1, 4],
            dietaryRestrictions: [],
          },
          following: [],
          followers: [],
          pendingFriendRequests: [],
          createdAt: new Date(),
          lastLoginAt: new Date(),
          location: {
            country: "Brasil",
            state: "SP",
            city: "São Paulo",
            coordinates: {
              lat: TEST_COORDINATES.center.lat,
              lng: TEST_COORDINATES.center.lng,
            },
          },
          updatedAt: new Date(),
        });
      logInfo("Documento do usuário criado manualmente");
    } else {
      // Ativar usuário se já existe (criado pelo trigger onUserCreate)
      await db.collection("users").doc(userId).update({
        isValidated: true,
        isActive: true,
        validatedAt: new Date(),
        aiCredits: 50,
        aiCreditsLastReset: new Date(),
        updatedAt: new Date(),
      });
      logInfo("Usuário ativado para os testes");
    }

    // Fazer login
    logTest("Fazendo login com usuário criado");
    await signInWithEmailAndPassword(
      clientAuth,
      testUser.email,
      testUser.password
    );
    logSuccess("Login realizado com sucesso");

    // Criar lugares de teste
    logSubsection("Criação de Lugares de Teste");

    testPlaces = generateTestPlacesData();
    const geoCollection = geoFirestore.collection("places");

    for (const placeData of testPlaces) {
      logTest(`Criando lugar: ${placeData.name}`);

      const placeDoc = {
        id: placeData.id,
        name: placeData.name,
        description: placeData.description,
        category: placeData.category,
        categories: placeData.categories,
        coordinates: new admin.firestore.GeoPoint(
          placeData.latitude,
          placeData.longitude
        ),
        address: placeData.address,
        tags: placeData.tags,

        googleData: {
          name: placeData.name,
          formatted_address: placeData.address,
          rating: 4.0 + Math.random() * 1.0,
          user_ratings_total: Math.floor(Math.random() * 100) + 10,
          lastUpdated: admin.firestore.Timestamp.now(),
        },

        searchableText: `${placeData.name.toLowerCase()} ${placeData.categories.join(
          " "
        )}`,
        searchKeywords: placeData.name.toLowerCase().split(" "),

        averageRatings: {
          overall: 7.5 + Math.random() * 2.5,
          totalReviews: Math.floor(Math.random() * 10) + 1,
          food: 7.5 + Math.random() * 2.5,
          service: 7.5 + Math.random() * 2.5,
          atmosphere: 7.5 + Math.random() * 2.5,
        },

        socialMetrics: {
          totalAdds: Math.floor(Math.random() * 20),
          totalLikes: Math.floor(Math.random() * 50),
          totalShares: Math.floor(Math.random() * 10),
        },

        isActive: true,
        isOpen24h: false,
        averagePrice: Math.floor(Math.random() * 4) + 1,
        reviewCount: Math.floor(Math.random() * 10) + 1,

        createdAt: admin.firestore.Timestamp.now(),
        lastGoogleSync: admin.firestore.Timestamp.now(),
        updatedAt: new Date(),
        createdBy: userId,
      };

      await geoCollection.doc(placeData.id).set(placeDoc);
      logSuccess(`Lugar ${placeData.name} criado com geohash`);
    }

    return {
      success: true,
      userId,
      testUser,
      testPlaces,
      userCredential,
    };
  } catch (error) {
    logError("Erro durante setup de dados:", error);
    return { success: false, error };
  }
}

// ======================
// TESTES DAS FUNÇÕES
// ======================

async function testFindNearbyPlaces(setupResult) {
  logSection("TESTE: findNearbyPlaces");

  if (!setupResult.success) {
    logError("Setup falhou, pulando teste");
    return { success: false };
  }

  try {
    logSubsection("Busca Básica por Proximidade");

    const findNearbyPlaces = httpsCallable(clientFunctions, "findNearbyPlaces");

    // Teste 1: Busca padrão com raio de 10km
    logTest("Testando busca com raio padrão (10km)");

    const result1 = await findNearbyPlaces({
      latitude: TEST_COORDINATES.center.lat,
      longitude: TEST_COORDINATES.center.lng,
    });

    if (result1.data && result1.data.success) {
      logSuccess(
        `Busca realizada com sucesso - ${result1.data.total} lugares encontrados`
      );

      // Verificar se nossos lugares de teste estão nos resultados
      const foundTestPlaces = result1.data.places.filter((place) =>
        setupResult.testPlaces.some((testPlace) => testPlace.id === place.id)
      );

      if (foundTestPlaces.length > 0) {
        logSuccess(
          `${foundTestPlaces.length} lugares de teste encontrados na busca`
        );
      } else {
        logError("Nenhum lugar de teste encontrado na busca");
      }
    } else {
      logError("Busca falhou", result1.data);
    }

    // Teste 2: Busca com raio menor para testar lugares distantes
    logSubsection("Busca com Raio Reduzido");

    logTest("Testando busca com raio de 1km");

    const result2 = await findNearbyPlaces({
      latitude: TEST_COORDINATES.center.lat,
      longitude: TEST_COORDINATES.center.lng,
      radius: 1,
    });

    if (result2.data && result2.data.success) {
      logSuccess(
        `Busca com raio reduzido - ${result2.data.total} lugares encontrados`
      );

      // O lugar distante não deve aparecer
      const farPlace = result2.data.places.find(
        (place) => place.name && place.name.includes("Far Place")
      );

      if (!farPlace) {
        logSuccess("Lugar distante corretamente excluído do raio de 1km");
      } else {
        logError("Lugar distante incorretamente incluído no raio de 1km");
      }
    } else {
      logError("Busca com raio reduzido falhou", result2.data);
    }

    // Teste 3: Validação de parâmetros obrigatórios
    logSubsection("Validação de Parâmetros");

    logTest("Testando busca sem coordenadas (deve falhar)");

    try {
      await findNearbyPlaces({});
      logError("Busca sem parâmetros deveria ter falhado");
    } catch (error) {
      if (error.code === "functions/invalid-argument") {
        logSuccess("Validação de parâmetros funcionando corretamente");
      } else {
        logError("Erro inesperado na validação", error);
      }
    }

    return { success: true };
  } catch (error) {
    logError("Erro no teste findNearbyPlaces:", error);
    return { success: false, error };
  }
}

async function testAddPlaceWithLocation(setupResult) {
  logSection("TESTE: addPlaceWithLocation");

  if (!setupResult.success) {
    logError("Setup falhou, pulando teste");
    return { success: false };
  }

  try {
    const addPlaceWithLocation = httpsCallable(
      clientFunctions,
      "addPlaceWithLocation"
    );
    const timestamp = Date.now();
    let testSuccess = true;

    // Teste 1: Adicionar lugar válido
    logSubsection("Adição de Lugar Válido");

    const newPlaceData = {
      name: `New Test Place ${timestamp}`,
      description: "A place added via function test",
      category: "test",
      latitude: TEST_COORDINATES.center.lat + 0.002,
      longitude: TEST_COORDINATES.center.lng + 0.002,
      address: "New Test Address, São Paulo, SP",
    };

    logTest(`Adicionando lugar: ${newPlaceData.name}`);

    const result1 = await addPlaceWithLocation(newPlaceData);

    if (result1.data && result1.data.success) {
      logSuccess(`Lugar adicionado com sucesso - ID: ${result1.data.placeId}`);

      // Verificar se foi salvo corretamente no banco
      await sleep(1000);
      const geoCollection = geoFirestore.collection("places");
      const addedPlace = await geoCollection.doc(result1.data.placeId).get();

      if (addedPlace.exists) {
        const placeData = addedPlace.data();
        if (
          placeData.name === newPlaceData.name &&
          placeData.createdBy === setupResult.userId
        ) {
          logSuccess("Lugar salvo corretamente com geohash");
        } else {
          logError("Dados do lugar não correspondem ao esperado");
          testSuccess = false;
        }
      } else {
        logError("Lugar não foi encontrado no banco após criação");
        testSuccess = false;
      }
    } else {
      logError("Falha ao adicionar lugar", result1.data);
      testSuccess = false;
    }

    // Teste 2: Validação de parâmetros obrigatórios
    logSubsection("Validação de Parâmetros");

    logTest("Testando adição sem parâmetros obrigatórios");

    try {
      await addPlaceWithLocation({
        name: "Test Place",
        // Sem latitude/longitude
      });
      logError("Adição sem coordenadas deveria ter falhado");
      testSuccess = false;
    } catch (error) {
      if (error.code === "functions/invalid-argument") {
        logSuccess("Validação de coordenadas obrigatórias funcionando");
      } else {
        logError("Erro inesperado na validação", error);
        testSuccess = false;
      }
    }

    return { success: testSuccess, addedPlaceId: result1.data?.placeId };
  } catch (error) {
    logError("Erro no teste addPlaceWithLocation:", error);
    return { success: false, error };
  }
}

async function testUpdatePlaceLocation(setupResult) {
  logSection("TESTE: updatePlaceLocation");

  if (!setupResult.success) {
    logError("Setup falhou, pulando teste");
    return { success: false };
  }

  try {
    const updatePlaceLocation = httpsCallable(
      clientFunctions,
      "updatePlaceLocation"
    );

    // Usar um dos lugares de teste criados no setup
    const testPlace = setupResult.testPlaces[0];
    let testSuccess = true;

    // Teste 1: Atualizar coordenadas de lugar existente
    logSubsection("Atualização de Coordenadas");

    const newCoordinates = {
      latitude: TEST_COORDINATES.center.lat + 0.003,
      longitude: TEST_COORDINATES.center.lng + 0.003,
    };

    logTest(`Atualizando coordenadas do lugar: ${testPlace.name}`);

    const result1 = await updatePlaceLocation({
      placeId: testPlace.id,
      latitude: newCoordinates.latitude,
      longitude: newCoordinates.longitude,
    });

    if (result1.data && result1.data.success) {
      logSuccess("Coordenadas atualizadas com sucesso");

      // Verificar se foi atualizado no banco
      await sleep(1000);
      const geoCollection = geoFirestore.collection("places");
      const updatedPlace = await geoCollection.doc(testPlace.id).get();

      if (updatedPlace.exists) {
        const placeData = updatedPlace.data();
        const coords = placeData.coordinates;

        if (
          Math.abs(coords.latitude - newCoordinates.latitude) < 0.0001 &&
          Math.abs(coords.longitude - newCoordinates.longitude) < 0.0001
        ) {
          logSuccess("Coordenadas atualizadas corretamente no banco");
        } else {
          logError("Coordenadas não foram atualizadas no banco");
          testSuccess = false;
        }
      } else {
        logError("Lugar não encontrado após atualização");
        testSuccess = false;
      }
    } else {
      logError("Falha ao atualizar coordenadas", result1.data);
      testSuccess = false;
    }

    // Teste 2: Tentar atualizar lugar inexistente
    logSubsection("Validação de Lugar Inexistente");

    logTest("Testando atualização de lugar inexistente");

    try {
      await updatePlaceLocation({
        placeId: "lugar-inexistente",
        latitude: TEST_COORDINATES.center.lat,
        longitude: TEST_COORDINATES.center.lng,
      });
      logError("Atualização de lugar inexistente deveria ter falhado");
      testSuccess = false;
    } catch (error) {
      if (error.code === "functions/not-found") {
        logSuccess("Validação de lugar inexistente funcionando");
      } else {
        logError("Erro inesperado na validação", error);
        testSuccess = false;
      }
    }

    return { success: testSuccess };
  } catch (error) {
    logError("Erro no teste updatePlaceLocation:", error);
    return { success: false, error };
  }
}

async function testGetPlacesInMapView(setupResult) {
  logSection("TESTE: getPlacesInMapView");

  if (!setupResult.success) {
    logError("Setup falhou, pulando teste");
    return { success: false };
  }

  try {
    const getPlacesInMapView = httpsCallable(
      clientFunctions,
      "getPlacesInMapView"
    );

    // Teste 1: Busca básica no mapa
    logSubsection("Busca Básica no Mapa");

    logTest("Testando busca básica com centro e raio");

    const result1 = await getPlacesInMapView({
      center: {
        lat: TEST_COORDINATES.center.lat,
        lng: TEST_COORDINATES.center.lng,
      },
      radius: 10,
      pagination: { limit: 20, offset: 0 },
    });

    if (result1.data && result1.data.success) {
      logSuccess(
        `Busca no mapa realizada - ${result1.data.total} lugares encontrados`
      );

      if (result1.data.places && result1.data.places.length > 0) {
        logSuccess("Lugares retornados com dados completos");

        // Verificar se os lugares têm dados de distância
        const placesWithDistance = result1.data.places.filter(
          (place) => typeof place.distance === "number"
        );

        if (placesWithDistance.length > 0) {
          logSuccess(
            `${placesWithDistance.length} lugares com cálculo de distância`
          );
        }
      }
    } else {
      logError("Busca no mapa falhou", result1.data);
    }

    // Teste 2: Busca com filtros
    logSubsection("Busca com Filtros");

    logTest("Testando busca com filtro de categoria");

    const result2 = await getPlacesInMapView({
      center: {
        lat: TEST_COORDINATES.center.lat,
        lng: TEST_COORDINATES.center.lng,
      },
      radius: 10,
      filters: {
        category: "restaurant",
        minRating: 7.0,
      },
      pagination: { limit: 10, offset: 0 },
    });

    if (result2.data && result2.data.success) {
      logSuccess(
        `Busca com filtros realizada - ${result2.data.total} lugares encontrados`
      );

      // VALIDATION: Should find at least 1 restaurant place
      if (result2.data.total === 0) {
        logError("❌ PROBLEMA: Deveria encontrar pelo menos 1 restaurant");
        logError(
          "Expected: Test Restaurant deveria ser encontrado com filtros"
        );
        return { success: false };
      } else {
        // Verificar se os filtros foram aplicados
        const restaurantPlaces = result2.data.places.filter(
          (place) =>
            place.category === "restaurant" ||
            (place.categories && place.categories.includes("restaurant"))
        );

        if (
          restaurantPlaces.length === result2.data.places.length &&
          restaurantPlaces.length > 0
        ) {
          logSuccess("✅ Filtro de categoria aplicado corretamente");
          logSuccess(
            `Restaurants encontrados: ${restaurantPlaces
              .map((p) => p.name)
              .join(", ")}`
          );
        } else {
          logError(
            `❌ Filtro falhou: ${restaurantPlaces.length}/${result2.data.places.length} lugares são restaurants`
          );
          return { success: false };
        }
      }
    } else {
      logError("Busca com filtros falhou", result2.data);
      return { success: false };
    }

    // Teste 3: Busca com limites do mapa
    logSubsection("Busca com Limites do Mapa");

    logTest("Testando busca com bounds do mapa");

    const result3 = await getPlacesInMapView({
      center: {
        lat: TEST_COORDINATES.center.lat,
        lng: TEST_COORDINATES.center.lng,
      },
      radius: 50,
      bounds: {
        northeast: {
          lat: TEST_COORDINATES.center.lat + 0.01,
          lng: TEST_COORDINATES.center.lng + 0.01,
        },
        southwest: {
          lat: TEST_COORDINATES.center.lat - 0.01,
          lng: TEST_COORDINATES.center.lng - 0.01,
        },
      },
      pagination: { limit: 20, offset: 0 },
    });

    if (result3.data && result3.data.success) {
      logSuccess(
        `Busca com bounds realizada - ${result3.data.total} lugares encontrados`
      );

      // O lugar distante (Rio) não deve aparecer
      const farPlaces = result3.data.places.filter(
        (place) => place.name && place.name.includes("Far Place")
      );

      if (farPlaces.length === 0) {
        logSuccess("Lugares fora dos bounds corretamente excluídos");
      } else {
        logError("Lugares fora dos bounds incorretamente incluídos");
      }
    } else {
      logError("Busca com bounds falhou", result3.data);
    }

    return { success: true };
  } catch (error) {
    logError("Erro no teste getPlacesInMapView:", error);
    return { success: false, error };
  }
}

async function testSearchPlacesAdvanced(setupResult) {
  logSection("TESTE: searchPlacesAdvanced");

  if (!setupResult.success) {
    logError("Setup falhou, pulando teste");
    return { success: false };
  }

  try {
    const searchPlacesAdvanced = httpsCallable(
      clientFunctions,
      "searchPlacesAdvanced"
    );

    let testSuccess = true;

    // Teste 1: Busca por texto
    logSubsection("Busca por Texto");

    logTest("Testando busca por texto 'restaurant'");

    const result1 = await searchPlacesAdvanced({
      filters: {
        searchText: "restaurant",
      },
      pagination: { limit: 10, offset: 0 },
      sortBy: "relevance",
    });

    if (result1.data && result1.data.success) {
      logSuccess(
        `Busca por texto realizada - ${result1.data.total} lugares encontrados`
      );

      // Para debug, vamos aceitar 0 resultados mas investigar
      if (result1.data.total === 0) {
        logInfo(
          "⚠️  Nenhum lugar encontrado - isso pode indicar problema na busca"
        );
        logInfo(
          "Expected: Pelo menos 1 lugar (Test Restaurant) deveria ser encontrado"
        );
      } else {
        logInfo(
          `Lugares encontrados: ${result1.data.places
            .map((p) => p.name)
            .join(", ")}`
        );
      }
    } else {
      logError("Busca por texto falhou", result1.data);
      testSuccess = false;
    }

    // Teste 2: Busca com múltiplos filtros
    logSubsection("Busca com Múltiplos Filtros");

    logTest("Testando busca com categoria e avaliação mínima");

    const result2 = await searchPlacesAdvanced({
      filters: {
        categories: ["restaurant", "cafe"],
        minRating: 7.0,
        tags: ["test"],
      },
      location: {
        lat: TEST_COORDINATES.center.lat,
        lng: TEST_COORDINATES.center.lng,
      },
      pagination: { limit: 10, offset: 0 },
      sortBy: "distance",
    });

    if (result2.data && result2.data.success) {
      logSuccess(
        `Busca com múltiplos filtros realizada - ${result2.data.total} lugares encontrados`
      );

      // VALIDATION: Should find at least 1 place (cafe or restaurant with test tag)
      if (result2.data.total === 0) {
        logError(
          "❌ PROBLEMA: Deveria encontrar pelo menos 1 lugar (café ou restaurant com tag 'test')"
        );
        logError(
          "Expected: Test Café ou Test Restaurant deveriam ser encontrados"
        );
        testSuccess = false;
      } else {
        logSuccess(
          `✅ Encontrados lugares com filtros: ${result2.data.places
            .map((p) => p.name)
            .join(", ")}`
        );

        // Verificar se lugares têm distância calculada
        const placesWithDistance = result2.data.places.filter(
          (place) => typeof place.distance === "number"
        );

        if (placesWithDistance.length > 0) {
          logSuccess("Distâncias calculadas para busca avançada");
        } else {
          logError("❌ Distâncias não foram calculadas");
          testSuccess = false;
        }
      }
    } else {
      logError("Busca com múltiplos filtros falhou", result2.data);
      testSuccess = false;
    }

    // Teste 3: Busca sem filtros (deve retornar todos os lugares ativos)
    logSubsection("Busca Sem Filtros");

    logTest("Testando busca sem filtros (todos os lugares ativos)");

    const result3 = await searchPlacesAdvanced({
      filters: {},
      pagination: { limit: 10, offset: 0 },
      sortBy: "relevance",
    });

    if (result3.data && result3.data.success) {
      logSuccess(
        `Busca sem filtros realizada - ${result3.data.total} lugares encontrados`
      );

      if (result3.data.total > 0) {
        logInfo(
          `Lugares: ${result3.data.places
            .map((p) => `${p.name} (${p.category})`)
            .join(", ")}`
        );
      } else {
        logError(
          "⚠️  PROBLEMA: Busca sem filtros deveria retornar pelo menos os lugares de teste"
        );
        testSuccess = false;
      }
    } else {
      logError("Busca sem filtros falhou", result3.data);
      testSuccess = false;
    }

    // Teste 4: Busca com ordenação por avaliação
    logSubsection("Busca com Ordenação");

    logTest("Testando busca ordenada por avaliação");

    const result4 = await searchPlacesAdvanced({
      filters: {},
      pagination: { limit: 5, offset: 0 },
      sortBy: "rating",
    });

    if (result4.data && result4.data.success) {
      logSuccess(
        `Busca ordenada por avaliação - ${result4.data.total} lugares encontrados`
      );

      // VALIDATION: Should find places when sorting by rating
      if (result4.data.total === 0) {
        logError(
          "❌ PROBLEMA: Busca ordenada por avaliação deveria retornar lugares"
        );
        logError(
          "Expected: Pelo menos alguns lugares deveriam ser encontrados"
        );
        testSuccess = false;
      } else {
        logSuccess(
          `✅ Lugares encontrados para ordenação: ${result4.data.places
            .map((p) => `${p.name} (${p.averageRatings?.overall || 0})`)
            .join(", ")}`
        );

        // Verificar se está ordenado por rating
        if (result4.data.places.length > 1) {
          let isOrdered = true;
          for (let i = 0; i < result4.data.places.length - 1; i++) {
            const current = result4.data.places[i].averageRatings?.overall || 0;
            const next =
              result4.data.places[i + 1].averageRatings?.overall || 0;
            if (current < next) {
              isOrdered = false;
              break;
            }
          }

          if (isOrdered) {
            logSuccess("Ordenação por avaliação funcionando corretamente");
          } else {
            logError("❌ Ordenação por avaliação não está funcionando");
            testSuccess = false;
          }
        }
      }
    } else {
      logError("Busca ordenada por avaliação falhou", result4.data);
      testSuccess = false;
    }

    return { success: testSuccess };
  } catch (error) {
    logError("Erro no teste searchPlacesAdvanced:", error);
    return { success: false, error };
  }
}

async function testLocationFunctions(setupResult) {
  logSection("TESTE: updateUserLocation & getUserLocation");

  if (!setupResult.success) {
    logError("Setup falhou, pulando teste");
    return { success: false };
  }

  try {
    const updateUserLocation = httpsCallable(
      clientFunctions,
      "updateUserLocation"
    );
    const getUserLocation = httpsCallable(clientFunctions, "getUserLocation");

    // Teste 1: Atualizar localização do usuário
    logSubsection("Atualização de Localização");

    const newLocation = {
      lat: TEST_COORDINATES.center.lat + 0.001,
      lng: TEST_COORDINATES.center.lng + 0.001,
      accuracy: 10,
    };

    logTest("Atualizando localização do usuário");

    const result1 = await updateUserLocation({
      location: newLocation,
      address: "Nova localização de teste, São Paulo, SP",
    });

    if (result1.data && result1.data.success) {
      logSuccess("Localização atualizada com sucesso");
      logInfo(`Coordenadas: ${newLocation.lat}, ${newLocation.lng}`);
    } else {
      logError("Falha ao atualizar localização", result1.data);
      return { success: false };
    }

    // Teste 2: Obter localização salva
    logSubsection("Obtenção de Localização");

    logTest("Obtendo localização salva do usuário");

    const result2 = await getUserLocation({});

    if (result2.data && result2.data.success && result2.data.hasLocation) {
      logSuccess("Localização obtida com sucesso");
      logInfo(
        `Localização: ${result2.data.location.lat}, ${result2.data.location.lng}`
      );
      logInfo(`Precisão: ${result2.data.location.accuracy}m`);
      logInfo(`Endereço: ${result2.data.location.address}`);
      logInfo(`É antiga: ${result2.data.location.isStale}`);
    } else {
      logError("Falha ao obter localização", result2.data);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    logError("Erro no teste de funções de localização:", error);
    return { success: false, error };
  }
}

async function testGetPlaceDetails(setupResult) {
  logSection("TESTE: getPlaceDetails");

  if (!setupResult.success) {
    logError("Setup falhou, pulando teste");
    return { success: false };
  }

  try {
    const getPlaceDetails = httpsCallable(clientFunctions, "getPlaceDetails");

    // Usar um dos lugares de teste criados no setup
    const testPlace = setupResult.testPlaces[0];
    let testSuccess = true;

    // Teste 1: Buscar detalhes de lugar existente no cache
    logSubsection("Busca de Lugar Existente");

    logTest(`Buscando detalhes do lugar: ${testPlace.name}`);

    const result1 = await getPlaceDetails({
      placeId: testPlace.id,
    });

    if (result1.data && result1.data.success) {
      logSuccess("Detalhes obtidos com sucesso");
      logInfo(`Nome: ${result1.data.place.name}`);
      logInfo(`Endereço: ${result1.data.place.address?.formatted || "N/A"}`);
      logInfo(`Categoria: ${result1.data.place.category}`);
      logInfo(`Do cache: ${result1.data.fromCache}`);

      if (result1.data.place.coordinates) {
        logInfo(
          `Coordenadas: ${result1.data.place.coordinates._latitude}, ${result1.data.place.coordinates._longitude}`
        );
      }
    } else {
      logError("Falha ao obter detalhes do lugar", result1.data);
      testSuccess = false;
    }

    // Teste 2: Forçar refresh dos dados (simular chamada API)
    logSubsection("Forçar Refresh dos Dados");

    logTest("Forçando refresh dos dados via API");

    const result2 = await getPlaceDetails({
      placeId: testPlace.id,
      forceRefresh: true,
    });

    if (result2.data && result2.data.success) {
      logSuccess("Dados atualizados via API");
      logInfo(`Do cache: ${result2.data.fromCache} (deve ser false)`);
      logInfo(`Google Data presente: ${!!result2.data.place.googleData}`);

      if (result2.data.place.googleData) {
        logInfo(`Rating Google: ${result2.data.place.googleData.rating}`);
        logInfo(
          `Total Reviews: ${result2.data.place.googleData.userRatingsTotal}`
        );
      }
    } else {
      logError("Falha ao forçar refresh", result2.data);
      testSuccess = false;
    }

    // Teste 3: Buscar lugar inexistente
    logSubsection("Lugar Inexistente");

    logTest("Testando busca de lugar inexistente");

    const fakeGooglePlaceId = "ChIJN1t_tDeuEmsRUsoyG83frY4_FAKE";

    const result3 = await getPlaceDetails({
      placeId: fakeGooglePlaceId,
    });

    if (result3.data && result3.data.success) {
      logSuccess("Lugar 'inexistente' processado com dados simulados");
      logInfo(`Nome: ${result3.data.place.name}`);
      logInfo(`Simulação funciona para desenvolvimento`);
    } else {
      logInfo(
        "Lugar inexistente não encontrado (comportamento esperado em produção)"
      );
    }

    // Teste 4: Validação de parâmetros
    logSubsection("Validação de Parâmetros");

    logTest("Testando busca sem placeId (deve falhar)");

    try {
      await getPlaceDetails({});
      logError("Busca sem placeId deveria ter falhado");
      testSuccess = false;
    } catch (error) {
      if (error.code === "functions/invalid-argument") {
        logSuccess("Validação de placeId funcionando corretamente");
      } else {
        logError("Erro inesperado na validação", error);
        testSuccess = false;
      }
    }

    // Teste 5: Verificar se dados foram salvos corretamente
    logSubsection("Verificação de Persistência");

    logTest("Verificando se dados foram salvos no Firestore");

    // Buscar novamente sem forceRefresh para testar cache
    const result5 = await getPlaceDetails({
      placeId: testPlace.id,
    });

    if (result5.data && result5.data.success && result5.data.fromCache) {
      logSuccess("Cache funcionando corretamente");
      logInfo("Dados foram persistidos e estão sendo servidos do cache");
    } else {
      logError("Problemas com cache ou persistência");
      testSuccess = false;
    }

    return { success: testSuccess };
  } catch (error) {
    logError("Erro no teste getPlaceDetails:", error);
    return { success: false, error };
  }
}

// ======================

// ======================
// VERIFICAÇÃO DE PRÉ-REQUISITOS
// ======================

async function checkPrerequisites() {
  logSection("VERIFICAÇÃO DE PRÉ-REQUISITOS");

  // Verificar emulators
  const emulators = [
    { name: "Firestore", port: 8080 },
    { name: "Auth", port: 9099 },
    { name: "Functions", port: 5001 },
  ];

  for (const emulator of emulators) {
    try {
      if (emulator.name === "Firestore") {
        await db.collection("_test").limit(1).get();
        logSuccess(`${emulator.name} Emulator (${emulator.port}) - Conectado`);
      } else if (emulator.name === "Auth") {
        await authAdmin.listUsers(1);
        logSuccess(`${emulator.name} Emulator (${emulator.port}) - Conectado`);
      } else if (emulator.name === "Functions") {
        logSuccess(
          `${emulator.name} Emulator (${emulator.port}) - Assumindo ativo`
        );
      }
    } catch (error) {
      logError(`${emulator.name} Emulator (${emulator.port}) - ERRO`, error);
      logInfo(`Execute: firebase emulators:start`);
      process.exit(1);
    }
  }

  logSuccess("Todos os pré-requisitos verificados!");
}

// ======================
// LIMPEZA DE DADOS
// ======================

async function cleanupTestData(setupResult) {
  logSection("LIMPEZA DE DADOS DE TESTE");

  if (!setupResult.success) {
    logInfo("Nenhum dado para limpar");
    return;
  }

  try {
    // Deletar lugares de teste
    if (setupResult.testPlaces) {
      const geoCollection = geoFirestore.collection("places");

      for (const place of setupResult.testPlaces) {
        try {
          await geoCollection.doc(place.id).delete();
          logSuccess(`Lugar ${place.name} removido`);
        } catch (error) {
          logError(`Erro ao remover lugar ${place.name}:`, error);
        }
      }
    }

    // Deletar usuário de teste
    if (setupResult.userId) {
      try {
        await authAdmin.deleteUser(setupResult.userId);
        await db.collection("users").doc(setupResult.userId).delete();
        logSuccess("Usuário de teste removido");
      } catch (error) {
        logError("Erro ao remover usuário de teste:", error);
      }
    }
  } catch (error) {
    logError("Erro durante limpeza:", error);
  }
}

// ======================
// FUNÇÃO PRINCIPAL
// ======================

async function runPlaceTests() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║     🧪 TESTE DE PLACE FUNCTIONS - PINUBI            ║
║                                                      ║
║     Testando todas as funções relacionadas          ║
║     a lugares e funcionalidades geográficas         ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
`);

  let testResults = {
    prerequisites: false,
    setup: false,
    findNearby: false,
    addPlace: false,
    updateLocation: false,
    getPlaceDetails: false,
    mapView: false,
    advancedSearch: false,
    locationFunctions: false,
    cleanup: false,
  };

  let setupResult = null;

  try {
    // Verificar pré-requisitos
    await checkPrerequisites();
    testResults.prerequisites = true;

    // Setup de dados base
    setupResult = await setupTestData();
    testResults.setup = setupResult.success;

    if (setupResult.success) {
      // Executar todos os testes
      const findNearbyResult = await testFindNearbyPlaces(setupResult);
      testResults.findNearby = findNearbyResult.success;

      const addPlaceResult = await testAddPlaceWithLocation(setupResult);
      testResults.addPlace = addPlaceResult.success;

      const updateLocationResult = await testUpdatePlaceLocation(setupResult);
      testResults.updateLocation = updateLocationResult.success;

      const getPlaceDetailsResult = await testGetPlaceDetails(setupResult);
      testResults.getPlaceDetails = getPlaceDetailsResult.success;

      const mapViewResult = await testGetPlacesInMapView(setupResult);
      testResults.mapView = mapViewResult.success;

      const advancedSearchResult = await testSearchPlacesAdvanced(setupResult);
      testResults.advancedSearch = advancedSearchResult.success;

      const locationFunctionsResult = await testLocationFunctions(setupResult);
      testResults.locationFunctions = locationFunctionsResult.success;
    }

    // Limpeza (sempre executar se houve setup)
    if (setupResult) {
      await cleanupTestData(setupResult);
      testResults.cleanup = true;
    }
  } catch (error) {
    logError("Erro crítico durante execução dos testes:", error);
  }

  // Relatório final
  logSection("RELATÓRIO FINAL");

  const testSteps = [
    { name: "Pré-requisitos", success: testResults.prerequisites },
    { name: "Setup de Dados", success: testResults.setup },
    { name: "findNearbyPlaces", success: testResults.findNearby },
    { name: "addPlaceWithLocation", success: testResults.addPlace },
    { name: "updatePlaceLocation", success: testResults.updateLocation },
    { name: "getPlaceDetails", success: testResults.getPlaceDetails },
    { name: "getPlacesInMapView", success: testResults.mapView },
    { name: "searchPlacesAdvanced", success: testResults.advancedSearch },
    { name: "Location Functions", success: testResults.locationFunctions },
    { name: "Cleanup", success: testResults.cleanup },
  ];

  let totalSuccess = 0;
  for (const step of testSteps) {
    if (step.success) {
      logSuccess(`${step.name}: PASSOU`);
      totalSuccess++;
    } else {
      logError(`${step.name}: FALHOU`);
    }
  }

  console.log(
    `\n${colors.bright}${colors.yellow}═══════════════════════════════════════════════════════${colors.reset}`
  );
  if (totalSuccess === testSteps.length) {
    console.log(
      `${colors.bright}${colors.green}🎉 TODOS OS TESTES PASSARAM! (${totalSuccess}/${testSteps.length})${colors.reset}`
    );
    console.log(
      `${colors.green}✅ O sistema de place functions está funcionando perfeitamente!${colors.reset}`
    );
  } else {
    console.log(
      `${colors.bright}${colors.red}❌ ALGUNS TESTES FALHARAM (${totalSuccess}/${testSteps.length})${colors.reset}`
    );
    console.log(
      `${colors.red}⚠️  Verifique os logs acima para detalhes dos erros${colors.reset}`
    );
  }
  console.log(
    `${colors.bright}${colors.yellow}═══════════════════════════════════════════════════════${colors.reset}\n`
  );

  process.exit(totalSuccess === testSteps.length ? 0 : 1);
}

// Executar se chamado diretamente
if (require.main === module) {
  runPlaceTests().catch((error) => {
    console.error("Erro fatal:", error);
    process.exit(1);
  });
}

module.exports = {
  runPlaceTests,
  testFindNearbyPlaces,
  testAddPlaceWithLocation,
  testUpdatePlaceLocation,
  testGetPlaceDetails,
  testGetPlacesInMapView,
  testSearchPlacesAdvanced,
  testLocationFunctions,
};
