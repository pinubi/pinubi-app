import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

// Para DESENVOLVIMENTO (emuladores)
const firebaseConfigDev = {
  projectId: 'demo-pinubi-functions',
  apiKey: 'AIzaSyDemoApiKeyForEmulatorUsage123456789',
  authDomain: 'demo-pinubi-functions.firebaseapp.com',
  storageBucket: 'demo-pinubi-functions.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456',
};

// Para PRODUÇÃO (substitua pelos seus valores reais)
const firebaseConfigProd = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Escolha o ambiente
const isDevelopment = false; // Set to true only when testing with emulators
const firebaseConfig = isDevelopment ? firebaseConfigDev : firebaseConfigProd;

console.log('🔧 Firebase Config - Environment:', isDevelopment ? 'DEVELOPMENT (Emulators)' : 'PRODUCTION');
console.log('🔧 Firebase Config - Project ID:', firebaseConfig.projectId);
console.log('🔧 Firebase Config - Full config:', firebaseConfig);

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const functions = getFunctions(app);
const firestore = getFirestore(app);

// Conectar aos emuladores apenas em desenvolvimento
if (isDevelopment) {
  console.log('🔧 Connecting to Firebase Emulators...');
  
  // Conectar ao Functions Emulator
  try {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    console.log('🔧 Functions Emulator connected on 127.0.0.1:5001');
  } catch (error) {
    console.log('Functions emulator already connected or failed to connect:', error);
  }

  // Conectar ao Firestore Emulator
  try {
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    console.log('🔧 Firestore Emulator connected on 127.0.0.1:8080');
  } catch (error) {
    console.log('Firestore emulator already connected or failed to connect:', error);
  }
  
  import('firebase/auth').then(({ connectAuthEmulator }) => {
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099');      
      console.log('🔧 Auth Emulator connected on 127.0.0.1:9099');
    } catch (error) {
      console.log('Auth emulator already connected or failed to connect:', error);
    }
  });  
} else {
  console.log('🔧 Using Production Firebase services');
}

// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
export { app, auth, firestore, functions };
