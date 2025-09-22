import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

// Get Firebase configuration from Expo Constants (loaded from app.config.js)
const firebaseConfigFromConstants = Constants.expoConfig?.extra?.firebaseConfig || {};

// Para PRODUÇÃO (usando configuração do app.config.js)
const firebaseConfigProd = {
  apiKey: firebaseConfigFromConstants.apiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: firebaseConfigFromConstants.authDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: firebaseConfigFromConstants.projectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: firebaseConfigFromConstants.storageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: firebaseConfigFromConstants.messagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: firebaseConfigFromConstants.appId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: firebaseConfigFromConstants.measurementId || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Para DESENVOLVIMENTO (emuladores)
const firebaseConfigDev = {
  projectId: 'demo-pinubi-functions',
  apiKey: 'AIzaSyDemoApiKeyForEmulatorUsage123456789',
  authDomain: 'demo-pinubi-functions.firebaseapp.com',
  storageBucket: 'demo-pinubi-functions.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456',
};

// Escolha o ambiente
const isDevelopment = false; // Set to true only when testing with emulators
const firebaseConfig = isDevelopment ? firebaseConfigDev : firebaseConfigProd;

// Validate that required Firebase config values are present in production
if (!isDevelopment) {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing Firebase configuration fields:', missingFields);
    console.error('❌ Please check your environment variables.');
    console.error('❌ firebaseConfig:', firebaseConfig);
    throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
  }
  
  console.log('✅ Firebase configuration loaded successfully');
  console.log('🔧 Project ID:', firebaseConfig.projectId);
}

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
