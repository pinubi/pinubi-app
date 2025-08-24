import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';


// Para DESENVOLVIMENTO (emuladores)
const firebaseConfigDev = {
  projectId: "demo-pinubi-functions",
  apiKey: "AIzaSyDemoApiKeyForEmulatorUsage123456789",
  authDomain: "demo-pinubi-functions.firebaseapp.com",
  storageBucket: "demo-pinubi-functions.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};

// Para PRODUÇÃO (substitua pelos seus valores reais)
const firebaseConfigProd = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Escolha o ambiente
const isDevelopment = false; // Set to true only when testing with emulators
const firebaseConfig = isDevelopment ? firebaseConfigDev : firebaseConfigProd;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

// Conectar aos emuladores apenas em desenvolvimento
if (isDevelopment) {
  // Conectar ao Functions Emulator
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  
  // Para Google Sign-In, escolha uma opção:
  
  // OPÇÃO A: Auth Emulator (apenas email/senha - SEM Google Sign-In)
  import('firebase/auth').then(({ connectAuthEmulator }) => {
    try {
      connectAuthEmulator(auth, "http://127.0.0.1:9099");
      console.log("🔧 Auth Emulator conectado - use usuários do seed");      
    } catch (error) {
      console.log("Auth emulator já conectado");
    }
  });
  
  // OPÇÃO B: Auth Real (permite Google Sign-In real + Functions locais)
  // Para usar Google Sign-In com emuladores, comente a seção acima e descomente abaixo:
  /*
  console.log("🔧 Auth Real + Functions Emulator - Google Sign-In disponível");
  // Neste caso, use firebaseConfigProd para auth e emulador para functions
  */
}

// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
export { app, auth, functions };
