/**
 * TEST LIST PLACES - PINUBI FUNCTIONS
 *
 * Este script testa especificamente a funcionalidade de adicionar lugares às listas
 * para verificar se as correções nas regras de segurança do Firestore funcionaram.
 *
 * Usage: node ./scripts/test-list-places.js (with emulators running)
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
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
} = require("firebase/firestore");
const {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} = require("firebase/functions");

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ======================
// SETUP DE DADOS
// ======================

async function setupTestData() {
  logSection("SETUP DE DADOS BASE");

  const timestamp = Date.now();
  const testUser = {
    email: `test-list-user-${timestamp}@pinubi-test.com`,
    password: "TestListUser123!",
    displayName: `Test List User ${timestamp}`,
  };

  try {
    // Criar usuário de teste
    logTest(`Criando usuário: ${testUser.email}`);
    
    const userCredential = await createUserWithEmailAndPassword(
      clientAuth,
      testUser.email,
      testUser.password
    );

    const userId = userCredential.user.uid;
    logSuccess(`Usuário criado com UID: ${userId}`);

    // Aguardar trigger criar documento
    await sleep(2000);

    // Ativar usuário para os testes
    await db.collection("users").doc(userId).set({
      id: userId,
      email: testUser.email,
      displayName: testUser.displayName,
      accountType: "free",
      isValidated: true,
      isActive: true,
      onboardingComplete: true,
      validatedAt: new Date(),
      listsCount: 0,
      placesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });

    logSuccess("Usuário ativado para os testes");

    // Fazer login
    await signInWithEmailAndPassword(clientAuth, testUser.email, testUser.password);
    logSuccess("Login realizado com sucesso");

    // Criar uma lista de teste
    logTest("Criando lista de teste");
    
    const listData = {
      id: `test-list-${timestamp}`,
      name: `Test List ${timestamp}`,
      description: "Lista de teste para verificar adição de lugares",
      visibility: "public",
      ownerId: userId,
      collaborators: [],
      editors: [],
      placesCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("lists").doc(listData.id).set(listData);
    logSuccess(`Lista criada: ${listData.name} (ID: ${listData.id})`);

    // Criar um lugar de teste
    logTest("Criando lugar de teste");
    
    const placeData = {
      id: `test-place-${timestamp}`,
      name: `Test Place ${timestamp}`,
      description: "Lugar de teste para adicionar à lista",
      category: "restaurant",
      coordinates: new admin.firestore.GeoPoint(-23.5505, -46.6333),
      address: "Test Address, São Paulo, SP",
      isActive: true,
      createdAt: new Date(),
      createdBy: userId,
    };

    await db.collection("places").doc(placeData.id).set(placeData);
    logSuccess(`Lugar criado: ${placeData.name} (ID: ${placeData.id})`);

    return {
      success: true,
      userId,
      testUser,
      listData,
      placeData,
    };

  } catch (error) {
    logError("Erro durante setup de dados:", error);
    return { success: false, error };
  }
}

// ======================
// TESTE DE ADIÇÃO DE LUGAR À LISTA
// ======================

async function testAddPlaceToList(setupResult) {
  logSection("TESTE: ADICIONAR LUGAR À LISTA");

  if (!setupResult.success) {
    logError("Setup falhou, pulando teste");
    return { success: false };
  }

  try {
    const { userId, listData, placeData } = setupResult;

    // Teste 1: Adicionar lugar à lista via Firestore Client
    logTest("Testando adição direta via Firestore Client");

    const listPlaceData = {
      listId: listData.id,
      placeId: placeData.id,
      addedBy: userId,
      addedAt: new Date(),
      order: 0,
      notes: "Lugar adicionado via teste automatizado",
    };

    // Tentar adicionar o lugar à lista
    const listPlacesRef = collection(clientDb, "listPlaces");
    const docRef = await addDoc(listPlacesRef, listPlaceData);
    
    logSuccess(`Lugar adicionado à lista com sucesso! DocID: ${docRef.id}`);

    // Verificar se foi salvo corretamente
    await sleep(1000);
    
    const addedDocQuery = query(
      collection(clientDb, "listPlaces"),
      where("listId", "==", listData.id),
      where("placeId", "==", placeData.id)
    );
    
    const querySnapshot = await getDocs(addedDocQuery);
    
    if (!querySnapshot.empty) {
      logSuccess("✅ Lugar encontrado na lista após adição");
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logInfo(`- Lista: ${data.listId}`);
        logInfo(`- Lugar: ${data.placeId}`);
        logInfo(`- Adicionado por: ${data.addedBy}`);
        logInfo(`- Notas: ${data.notes}`);
      });
    } else {
      logError("❌ Lugar não foi encontrado na lista após adição");
      return { success: false };
    }

    // Teste 2: Tentar adicionar o mesmo lugar novamente (deve funcionar para lugares diferentes)
    logTest("Testando adição de um segundo lugar");

    const placeData2 = {
      id: `test-place-2-${Date.now()}`,
      name: `Test Place 2 ${Date.now()}`,
      description: "Segundo lugar de teste",
      category: "cafe",
      coordinates: new admin.firestore.GeoPoint(-23.5507, -46.6335),
      address: "Test Address 2, São Paulo, SP",
      isActive: true,
      createdAt: new Date(),
      createdBy: userId,
    };

    await db.collection("places").doc(placeData2.id).set(placeData2);

    const listPlaceData2 = {
      listId: listData.id,
      placeId: placeData2.id,
      addedBy: userId,
      addedAt: new Date(),
      order: 1,
      notes: "Segundo lugar adicionado via teste",
    };

    const docRef2 = await addDoc(listPlacesRef, listPlaceData2);
    logSuccess(`Segundo lugar adicionado com sucesso! DocID: ${docRef2.id}`);

    // Verificar quantos lugares estão na lista agora
    const allPlacesQuery = query(
      collection(clientDb, "listPlaces"),
      where("listId", "==", listData.id)
    );
    
    const allPlacesSnapshot = await getDocs(allPlacesQuery);
    logSuccess(`✅ Total de lugares na lista: ${allPlacesSnapshot.size}`);

    if (allPlacesSnapshot.size === 2) {
      logSuccess("✅ Ambos os lugares foram adicionados corretamente");
      return { success: true };
    } else {
      logError(`❌ Esperado 2 lugares, encontrado ${allPlacesSnapshot.size}`);
      return { success: false };
    }

  } catch (error) {
    logError("Erro ao adicionar lugar à lista:", error);
    return { success: false, error };
  }
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
    const { userId, listData, placeData } = setupResult;

    // Deletar listPlaces
    const listPlacesQuery = await db.collection("listPlaces")
      .where("listId", "==", listData.id)
      .get();
    
    for (const doc of listPlacesQuery.docs) {
      await doc.ref.delete();
    }
    logSuccess("ListPlaces removidos");

    // Deletar lista
    await db.collection("lists").doc(listData.id).delete();
    logSuccess("Lista removida");

    // Deletar lugar(s)
    await db.collection("places").doc(placeData.id).delete();
    
    // Deletar segundo lugar se existir
    const placesQuery = await db.collection("places")
      .where("createdBy", "==", userId)
      .get();
    
    for (const doc of placesQuery.docs) {
      await doc.ref.delete();
    }
    logSuccess("Lugares removidos");

    // Deletar usuário
    await authAdmin.deleteUser(userId);
    await db.collection("users").doc(userId).delete();
    logSuccess("Usuário de teste removido");

  } catch (error) {
    logError("Erro durante limpeza:", error);
  }
}

// ======================
// FUNÇÃO PRINCIPAL
// ======================

async function runListPlacesTest() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║     🧪 TESTE DE LIST PLACES - PINUBI                ║
║                                                      ║
║     Verificando se a correção nas regras de         ║
║     segurança do Firestore funcionou                ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
`);

  let setupResult = null;

  try {
    // Setup de dados base
    setupResult = await setupTestData();

    if (setupResult.success) {
      // Executar teste principal
      const testResult = await testAddPlaceToList(setupResult);

      if (testResult.success) {
        logSection("✅ TESTE PASSOU!");
        console.log(`${colors.green}🎉 A correção das regras funcionou!${colors.reset}`);
        console.log(`${colors.green}✅ Lugares podem ser adicionados às listas sem erro!${colors.reset}`);
      } else {
        logSection("❌ TESTE FALHOU");
        console.log(`${colors.red}💥 Ainda há problemas com as regras de segurança${colors.reset}`);
      }
    }

    // Limpeza
    if (setupResult) {
      await cleanupTestData(setupResult);
    }

  } catch (error) {
    logError("Erro crítico durante execução do teste:", error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runListPlacesTest().catch((error) => {
    console.error("Erro fatal:", error);
    process.exit(1);
  });
}

module.exports = { runListPlacesTest };
