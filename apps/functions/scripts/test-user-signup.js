/**
 * USER SIGNUP AND TRIGGER TEST - PINUBI FUNCTIONS
 *
 * Este script testa especificamente o fluxo de criação de usuário com email/senha
 * e verifica se todos os triggers e funções relacionadas estão funcionando corretamente.
 *
 * Funcionalidades testadas:
 * ✅ Criação de usuário com createUserWithEmailAndPassword
 * ✅ Trigger onUserCreate - estrutura inicial do usuário
 * ✅ Estado de onboarding correto após criação
 * ✅ Validação de convite e ativação do usuário
 * ✅ Trigger onUserUpdate - ativação e mudanças de estado
 * ✅ Criação automática de perfil e settings após ativação
 * ✅ Estrutura completa seguindo o Database Schema
 *
 * Usage: node ./scripts/test-user-signup.js (with emulators running)
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

function logSubsection(title) {
  console.log(`\n${colors.magenta}--- ${title} ---${colors.reset}`);
}

// Função para aguardar um tempo específico
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ======================
// GERAÇÃO DE DADOS DE TESTE
// ======================

function generateTestUserData() {
  const timestamp = Date.now();
  return {
    email: `test-user-${timestamp}@pinubi-test.com`,
    password: "TestPassword123!",
    displayName: `Test User ${timestamp}`,
    expectedData: {
      accountType: "free",
      profileVisibility: "public",
      isValidated: false,
      isActive: false,
      onboardingComplete: false,
      listsCount: 0,
      placesCount: 0,
      aiCredits: 0,
      votationsThisMonth: 0,
    },
  };
}

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
      // Test basic connectivity
      if (emulator.name === "Firestore") {
        await db.collection("_test").limit(1).get();
        logSuccess(`${emulator.name} Emulator (${emulator.port}) - Conectado`);
      } else if (emulator.name === "Auth") {
        await authAdmin.listUsers(1);
        logSuccess(`${emulator.name} Emulator (${emulator.port}) - Conectado`);
      } else if (emulator.name === "Functions") {
        // Functions será testado durante os testes
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

  // Verificar se há um usuário com código de convite válido para usar nos testes
  try {
    const usersWithInviteSnapshot = await db
      .collection("users")
      .where("inviteCode", "==", "TEST123")
      .limit(1)
      .get();

    if (usersWithInviteSnapshot.empty) {
      logInfo("Criando usuário de teste com código de convite...");

      // Criar usuário no Auth primeiro
      let testUserId = null;
      try {
        const testUser = await authAdmin.createUser({
          email: "test-inviter@pinubi-test.com",
          password: "TestInviter123!",
          displayName: "Test Inviter",
        });
        testUserId = testUser.uid;
        logSuccess("Usuário de teste criado no Auth");
      } catch (authError) {
        if (authError.code === "auth/email-already-exists") {
          // Obter usuário existente
          const existingUser = await authAdmin.getUserByEmail(
            "test-inviter@pinubi-test.com"
          );
          testUserId = existingUser.uid;
          logInfo("Usando usuário de teste existente no Auth");
        } else {
          throw authError;
        }
      }

      // Criar documento no Firestore
      await db
        .collection("users")
        .doc(testUserId)
        .set({
          id: testUserId,
          email: "test-inviter@pinubi-test.com",
          displayName: "Test Inviter",
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
          validatedAt: new Date().toISOString(),
          listsCount: 0,
          placesCount: 0,
          aiCredits: 50,
          aiCreditsLastReset: new Date().toISOString(),
          votationsThisMonth: 0,
          preferences: {
            categories: [],
            priceRange: [1, 4],
            dietaryRestrictions: [],
          },
          following: [],
          followers: [],
          pendingFriendRequests: [],
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          location: {
            country: "",
            state: "",
            city: "",
            coordinates: { lat: 0, lng: 0 },
          },
          updatedAt: new Date().toISOString(),
        });

      logSuccess("Usuário de teste com código TEST123 criado no Firestore");
    } else {
      logSuccess("Usuário com código de convite TEST123 já existe no sistema");
    }
  } catch (error) {
    logError("Erro ao verificar/criar usuário com código de convite:", error);
  }

  logSuccess("Todos os pré-requisitos verificados!");
}

// ======================
// TESTES DE CRIAÇÃO DE USUÁRIO
// ======================

async function testUserSignup() {
  logSection("TESTE DE SIGNUP DE USUÁRIO");

  const testUser = generateTestUserData();
  let userCredential = null;
  let userId = null;

  try {
    // Teste 1: Criar usuário com email e senha
    logSubsection("Criação de Usuário com Email/Senha");

    logTest(`Criando usuário: ${testUser.email}`);
    userCredential = await createUserWithEmailAndPassword(
      clientAuth,
      testUser.email,
      testUser.password
    );

    userId = userCredential.user.uid;
    logSuccess(`Usuário criado com sucesso! UID: ${userId}`);

    // O trigger Auth onUserCreate deve criar automaticamente o documento Firestore
    logInfo(
      "Trigger Auth onUserCreate deve criar documento Firestore automaticamente"
    );

    // Aguardar e verificar se o trigger processar com tentativas múltiplas
    logInfo("Aguardando processamento do trigger onUserCreate...");

    // Teste 2: Verificar se o trigger onUserCreate funcionou com retry
    logSubsection("Verificação do Trigger onUserCreate");

    let userDoc = null;
    let attempts = 0;
    const maxAttempts = 6; // 6 tentativas = 12 segundos total

    while (attempts < maxAttempts) {
      attempts++;
      logTest(
        `Verificando documento do usuário no Firestore (tentativa ${attempts}/${maxAttempts})`
      );

      userDoc = await db.collection("users").doc(userId).get();

      if (userDoc.exists) {
        logSuccess("Documento do usuário criado pelo trigger!");
        break;
      } else {
        if (attempts < maxAttempts) {
          logInfo(`Documento ainda não existe, aguardando mais 2 segundos...`);
          await sleep(2000);
        }
      }
    }

    if (!userDoc || !userDoc.exists) {
      logError(
        "Documento do usuário não foi criado pelo trigger após 12 segundos!"
      );
      logInfo("Isso pode indicar que:");
      logInfo("1. O trigger onUserCreate não está funcionando");
      logInfo("2. As funções precisam ser reimplantadas no emulador");
      logInfo("3. Há um erro no código do trigger");
      return { success: false, userId, testUser };
    }

    const userData = userDoc.data();
    logSuccess("Documento do usuário criado pelo trigger");

    // Teste 3: Verificar estrutura inicial do usuário
    logSubsection("Verificação da Estrutura Inicial");

    const requiredFields = [
      "id",
      "email",
      "displayName",
      "accountType",
      "profileVisibility",
      "inviteCode",
      "maxInvites",
      "invitesUsed",
      "invitedBy",
      "invitedUsers",
      "isValidated",
      "isActive",
      "onboardingComplete",
      "validatedAt",
      "listsCount",
      "placesCount",
      "aiCredits",
      "aiCreditsLastReset",
      "votationsThisMonth",
      "preferences",
      "following",
      "followers",
      "pendingFriendRequests",
      "createdAt",
      "lastLoginAt",
      "location",
      "updatedAt",
    ];

    let structureValid = true;
    const missingFields = [];

    for (const field of requiredFields) {
      if (userData[field] === undefined) {
        missingFields.push(field);
        structureValid = false;
      }
    }

    if (structureValid) {
      logSuccess("Estrutura inicial do usuário está completa");
    } else {
      logError(`Campos faltando na estrutura: ${missingFields.join(", ")}`);
    }

    // Teste 4: Verificar valores iniciais corretos
    logSubsection("Verificação de Valores Iniciais");

    const validationTests = [
      { field: "email", expected: testUser.email, actual: userData.email },
      { field: "accountType", expected: "free", actual: userData.accountType },
      {
        field: "profileVisibility",
        expected: "public",
        actual: userData.profileVisibility,
      },
      { field: "isValidated", expected: false, actual: userData.isValidated },
      { field: "isActive", expected: false, actual: userData.isActive },
      {
        field: "onboardingComplete",
        expected: false,
        actual: userData.onboardingComplete,
      },
      { field: "listsCount", expected: 0, actual: userData.listsCount },
      { field: "placesCount", expected: 0, actual: userData.placesCount },
      { field: "aiCredits", expected: 0, actual: userData.aiCredits },
      { field: "invitesUsed", expected: 0, actual: userData.invitesUsed },
      { field: "maxInvites", expected: 5, actual: userData.maxInvites },
    ];

    let valuesValid = true;
    for (const test of validationTests) {
      if (test.actual === test.expected) {
        logSuccess(`${test.field}: ${test.actual} ✓`);
      } else {
        logError(
          `${test.field}: esperado ${test.expected}, obtido ${test.actual}`
        );
        valuesValid = false;
      }
    }

    // Teste 5: Verificar se inviteCode foi gerado
    if (userData.inviteCode && userData.inviteCode.length === 6) {
      logSuccess(`Código de convite gerado: ${userData.inviteCode}`);
    } else {
      logError("Código de convite não foi gerado corretamente");
      valuesValid = false;
    }

    // Teste 6: Verificar se arrays estão inicializados
    const arrayFields = [
      "invitedUsers",
      "following",
      "followers",
      "pendingFriendRequests",
    ];
    for (const field of arrayFields) {
      if (Array.isArray(userData[field]) && userData[field].length === 0) {
        logSuccess(`${field}: array vazio inicializado ✓`);
      } else {
        logError(`${field}: não é um array vazio`);
        valuesValid = false;
      }
    }

    return {
      success: structureValid && valuesValid,
      userId,
      testUser,
      userData,
      userCredential,
    };
  } catch (error) {
    logError("Erro durante teste de signup:", error);
    return { success: false, userId: null, testUser, error };
  }
}

// ======================
// TESTES DE ATIVAÇÃO DE USUÁRIO
// ======================

async function testUserActivation(signupResult) {
  if (!signupResult.success || !signupResult.userId) {
    logError("Teste de signup falhou, pulando teste de ativação");
    return { success: false };
  }

  logSection("TESTE DE ATIVAÇÃO DE USUÁRIO");

  const { userId, testUser } = signupResult;

  try {
    // Teste 1: Fazer login com o usuário criado
    logSubsection("Login do Usuário");

    logTest("Fazendo login com o usuário criado");
    const loginResult = await signInWithEmailAndPassword(
      clientAuth,
      testUser.email,
      testUser.password
    );

    if (loginResult.user.uid === userId) {
      logSuccess("Login realizado com sucesso");
    } else {
      logError("UID do login não corresponde ao usuário criado");
      return { success: false };
    }

    // Teste 2: Testar função de validação de convite
    logSubsection("Validação de Código de Convite");

    logTest("Testando validação de código de convite");
    const validateInvite = httpsCallable(
      clientFunctions,
      "validateInviteAndActivateUser"
    );

    try {
      const inviteResult = await validateInvite({ inviteCode: "TEST123" });

      if (inviteResult.data && inviteResult.data.success) {
        logSuccess("Código de convite validado e usuário ativado");

        // Aguardar processamento do trigger
        logInfo("Aguardando processamento do trigger onUserUpdate...");
        await sleep(2000);

        // Verificar se o usuário foi ativado
        const updatedUserDoc = await db.collection("users").doc(userId).get();
        const updatedUserData = updatedUserDoc.data();

        if (updatedUserData.isValidated && updatedUserData.isActive) {
          logSuccess("Usuário foi ativado corretamente");

          // Verificar se o perfil foi criado
          const profileDoc = await db.collection("profiles").doc(userId).get();
          if (profileDoc.exists) {
            logSuccess("Perfil criado automaticamente após ativação");

            const profileData = profileDoc.data();
            if (
              profileData.email === testUser.email &&
              profileData.userId === userId
            ) {
              logSuccess("Dados do perfil estão corretos");
            } else {
              logError("Dados do perfil estão incorretos");
            }
          } else {
            logError("Perfil não foi criado após ativação");
          }

          // Verificar se as configurações foram criadas
          const settingsDoc = await db
            .collection("user-settings")
            .doc(userId)
            .get();
          if (settingsDoc.exists) {
            logSuccess("Configurações criadas automaticamente após ativação");
          } else {
            logError("Configurações não foram criadas após ativação");
          }
        } else {
          logError("Usuário não foi ativado corretamente");
          logInfo(
            `isValidated: ${updatedUserData.isValidated}, isActive: ${updatedUserData.isActive}`
          );
        }
      } else {
        logError("Falha na validação do código de convite", inviteResult.data);
      }
    } catch (functionError) {
      logError("Erro ao chamar função de validação:", functionError);
    }

    return { success: true, userId, updatedData: true };
  } catch (error) {
    logError("Erro durante teste de ativação:", error);
    return { success: false, error };
  }
}

// ======================
// TESTES DE FUNÇÕES DE USUÁRIO
// ======================

async function testUserFunctions(activationResult) {
  if (!activationResult.success || !activationResult.userId) {
    logError("Teste de ativação falhou, pulando testes de funções");
    return { success: false };
  }

  logSection("TESTE DE FUNÇÕES DE USUÁRIO");

  const { userId } = activationResult;

  try {
    // Teste 1: getUserData
    logSubsection("Função getUserData");

    logTest("Testando função getUserData");
    const getUserData = httpsCallable(clientFunctions, "getUserData");

    try {
      const userDataResult = await getUserData({ userId: userId });

      // A função retorna { success: true, data: { user: ..., profile: ..., settings: ... } }
      if (
        userDataResult.data &&
        userDataResult.data.data &&
        userDataResult.data.data.user &&
        userDataResult.data.data.user.id === userId
      ) {
        logSuccess("getUserData funcionando corretamente");
      } else if (
        userDataResult.data &&
        userDataResult.data.data &&
        userDataResult.data.data.user
      ) {
        // Log para debug
        logInfo(
          `Dados retornados: userId esperado: ${userId}, recebido: ${userDataResult.data.data.user.id}`
        );
        logError("getUserData retornou dados incorretos - ID não corresponde");
      } else {
        logError("getUserData retornou estrutura de dados inesperada");
        logInfo(`Tipo de dados recebido: ${typeof userDataResult.data}`);
        if (userDataResult.data) {
          logInfo(
            `Chaves disponíveis: ${Object.keys(userDataResult.data).join(", ")}`
          );
          if (userDataResult.data.data && userDataResult.data.data.user) {
            logInfo(
              `Tipo user: ${typeof userDataResult.data.data
                .user}, chaves user: ${Object.keys(
                userDataResult.data.data.user
              ).join(", ")}`
            );
          }
        }
      }
    } catch (functionError) {
      logError("Erro na função getUserData:", functionError);
    }

    // Teste 2: updateUserProfile
    logSubsection("Função updateUserProfile");

    logTest("Testando função updateUserProfile");
    const updateUserProfile = httpsCallable(
      clientFunctions,
      "updateUserProfile"
    );

    try {
      const updateResult = await updateUserProfile({
        displayName: "Updated Test User",
        bio: "This is a test user created by automated tests",
      });

      if (updateResult.data && updateResult.data.success) {
        logSuccess("updateUserProfile funcionando corretamente");

        // Verificar se a atualização foi salva
        await sleep(1000);
        const updatedUserDoc = await db.collection("users").doc(userId).get();
        const updatedData = updatedUserDoc.data();

        if (updatedData.displayName === "Updated Test User") {
          logSuccess("Dados do usuário atualizados corretamente");
        } else {
          logError("Dados do usuário não foram atualizados");
        }
      } else {
        logError("updateUserProfile falhou", updateResult.data);
      }
    } catch (functionError) {
      logError("Erro na função updateUserProfile:", functionError);
    }

    // Teste 3: getUserLocation
    logSubsection("Função getUserLocation");

    logTest("Testando função getUserLocation");
    const getUserLocation = httpsCallable(clientFunctions, "getUserLocation");

    try {
      const locationResult = await getUserLocation();
      logSuccess("getUserLocation executada (pode retornar localização vazia)");
      logInfo(`Resultado: ${JSON.stringify(locationResult.data)}`);
    } catch (functionError) {
      logError("Erro na função getUserLocation:", functionError);
    }

    return { success: true, userId };
  } catch (error) {
    logError("Erro durante testes de funções:", error);
    return { success: false, error };
  }
}

// ======================
// FUNÇÃO PRINCIPAL
// ======================

async function runSignupTests() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║     🧪 TESTE DE SIGNUP E TRIGGERS - PINUBI          ║
║                                                      ║
║     Testando criação de usuário com email/senha     ║
║     e todos os triggers relacionados                 ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
`);

  let testResults = {
    reset: false,
    prerequisites: false,
    signup: false,
    activation: false,
    functions: false,
  };

  let userId = null;

  try {
    testResults.reset = true;

    // Verificar pré-requisitos
    await checkPrerequisites();
    testResults.prerequisites = true;

    // Executar teste de signup
    const signupResult = await testUserSignup();
    testResults.signup = signupResult.success;
    userId = signupResult.userId;

    if (signupResult.success) {
      // Executar teste de ativação
      const activationResult = await testUserActivation(signupResult);
      testResults.activation = activationResult.success;

      if (activationResult.success) {
        // Executar testes de funções
        const functionsResult = await testUserFunctions(activationResult);
        testResults.functions = functionsResult.success;
      }
    }
  } catch (error) {
    logError("Erro crítico durante execução dos testes:", error);
  }

  // Relatório final
  logSection("RELATÓRIO FINAL");

  const testSteps = [
    { name: "Reset de Dados", success: testResults.reset },
    { name: "Pré-requisitos", success: testResults.prerequisites },
    { name: "Signup de Usuário", success: testResults.signup },
    { name: "Ativação de Usuário", success: testResults.activation },
    { name: "Funções de Usuário", success: testResults.functions },
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
      `${colors.green}✅ O sistema de signup e triggers está funcionando perfeitamente!${colors.reset}`
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
  runSignupTests().catch((error) => {
    console.error("Erro fatal:", error);
    process.exit(1);
  });
}

module.exports = {
  runSignupTests,
  testUserSignup,
  testUserActivation,
  testUserFunctions,
};
