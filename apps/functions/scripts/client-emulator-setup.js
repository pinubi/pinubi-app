// client-emulator-config.js
// Como conectar o cliente aos emuladores locais

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDXw96DSFjE8fdow1I_m1cgIqcspJPKKnI",
  authDomain: "pinubi-92205.firebaseapp.com",
  projectId: "pinubi-92205",
  storageBucket: "pinubi-92205.firebasestorage.app",
  messagingSenderId: "1095087464043",
  appId: "1:1095087464043:web:2f105e718e1f4df183db2e",
  measurementId: "G-PKRLMR9LFQ",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// 🔧 CONECTAR AOS EMULADORES (apenas em desenvolvimento)
const isDevelopment = window.location.hostname === "localhost";

if (isDevelopment) {
  console.log("🔧 Conectando aos emuladores locais...");

  // Conectar Auth Emulator
  connectAuthEmulator(auth, "http://localhost:9099", {
    disableWarnings: true,
  });

  // Conectar Firestore Emulator
  connectFirestoreEmulator(db, "localhost", 8080);

  // Conectar Storage Emulator
  connectStorageEmulator(storage, "localhost", 9199);

  // Conectar Functions Emulator
  connectFunctionsEmulator(functions, "localhost", 5001);

  console.log("✅ Emuladores conectados!");
} else {
  console.log("🚀 Usando Firebase produção");
}

export { auth, db, storage, functions };

// ====================================
// EXEMPLO DE USO
// ====================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

// Criar usuário (usará emulador se em desenvolvimento)
export async function createUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("✅ Usuário criado:", userCredential.user.uid);
    return userCredential;
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error);
    throw error;
  }
}

// Salvar dados no Firestore (usará emulador se em desenvolvimento)
export async function saveUserData(userId, data) {
  try {
    await setDoc(doc(db, "users", userId), data);
    console.log("✅ Dados salvos no Firestore");
  } catch (error) {
    console.error("❌ Erro ao salvar dados:", error);
    throw error;
  }
}

// Chamar Cloud Function (usará emulador se em desenvolvimento)
export async function callHelloWorld() {
  try {
    const helloWorld = httpsCallable(functions, "helloWorld");
    const result = await helloWorld();
    console.log("✅ Function chamada:", result.data);
    return result;
  } catch (error) {
    console.error("❌ Erro ao chamar function:", error);
    throw error;
  }
}
