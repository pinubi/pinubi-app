// src/emulator-config.ts
// Configuração para usar emuladores locais nas Functions

import * as admin from 'firebase-admin';

// Verificar se está rodando nos emuladores
const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

if (isEmulator) {
  console.log('🔧 Rodando nos emuladores locais');

  // Configurar Firestore emulator
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

  // Configurar Auth emulator
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

  // Configurar Storage emulator
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
}

// Inicializar Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

export { admin, isEmulator };
