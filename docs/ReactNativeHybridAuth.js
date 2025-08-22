/**
 * 🔥 GOOGLE SIGN-IN + EMULADORES - CONFIGURAÇÃO HÍBRIDA
 * 
 * Este exemplo mostra como usar Google Sign-In REAL 
 * com Functions/Firestore emulators para desenvolvimento
 * 
 * 🎯 Setup:
 * - Auth: REAL (permite Google Sign-In)
 * - Functions: EMULATOR (desenvolvimento local)
 * - Firestore: EMULATOR (dados locais)
 * 
 * 📦 Instalação:
 * npx expo install firebase
 * npx expo install @react-native-google-signin/google-signin
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCredential,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  getFunctions, 
  httpsCallable,
  connectFunctionsEmulator 
} from 'firebase/functions';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useState, useEffect } from 'react';

// ===========================
// CONFIGURAÇÃO HÍBRIDA
// ===========================

// IMPORTANTE: Para Google Sign-In + Emulators use configuração REAL
const firebaseConfig = {
  projectId: "seu-projeto-real",  // ⚠️ Use projeto REAL, não demo
  apiKey: "sua-api-key-real",     // ⚠️ Use API key REAL
  authDomain: "seu-projeto.firebaseapp.com", // ⚠️ Use domínio REAL
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "sua-app-id-real",
};

// Para desenvolvimento APENAS com emuladores (sem Google Sign-In)
const firebaseConfigEmulatorOnly = {
  projectId: "demo-pinubi-functions",
  apiKey: "AIzaSyDemoApiKeyForEmulatorUsage123456789",
  authDomain: "demo-pinubi-functions.firebaseapp.com",
  storageBucket: "demo-pinubi-functions.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};

// Escolha o modo de desenvolvimento
const USE_GOOGLE_SIGNIN = true; // true = Auth real + Google, false = Emuladores apenas

const configToUse = USE_GOOGLE_SIGNIN ? firebaseConfig : firebaseConfigEmulatorOnly;

// Inicializar Firebase
const app = initializeApp(configToUse);
const auth = getAuth(app);
const functions = getFunctions(app);

// ===========================
// CONFIGURAR EMULADORES
// ===========================

if (__DEV__) {
  // SEMPRE conectar Functions ao emulador (mesmo com Auth real)
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  console.log("🔧 Functions Emulator conectado: 127.0.0.1:5001");
  
  if (!USE_GOOGLE_SIGNIN) {
    // Apenas use Auth emulator se NÃO for usar Google Sign-In
    import('firebase/auth').then(({ connectAuthEmulator }) => {
      try {
        connectAuthEmulator(auth, "http://127.0.0.1:9099");
        console.log("🔧 Auth Emulator conectado: 127.0.0.1:9099");
      } catch (error) {
        console.log("Auth emulator já conectado");
      }
    });
  } else {
    console.log("🔧 Auth REAL + Functions Emulator - Google Sign-In disponível");
  }
}

// ===========================
// CONFIGURAR GOOGLE SIGN-IN
// ===========================

GoogleSignin.configure({
  webClientId: 'seu-web-client-id.apps.googleusercontent.com', // Do Firebase Console
  iosClientId: 'seu-ios-client-id.apps.googleusercontent.com', // Opcional
  offlineAccess: true,
});

// ===========================
// SERVIÇO DE AUTENTICAÇÃO
// ===========================

class HybridAuthService {
  async signInWithGoogle() {
    try {
      if (!USE_GOOGLE_SIGNIN) {
        throw new Error('Google Sign-In desabilitado. Configure USE_GOOGLE_SIGNIN = true');
      }

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const googleCredential = GoogleAuthProvider.credential(
        userInfo.idToken,
        userInfo.accessToken
      );
      
      const firebaseResult = await signInWithCredential(auth, googleCredential);
      
      // Sincronizar com Pinubi Functions (que estão no emulador)
      await this.syncWithPinubi(firebaseResult.user, userInfo);
      
      return {
        success: true,
        user: firebaseResult.user,
        googleData: userInfo
      };

    } catch (error) {
      console.error('Erro Google Sign-In:', error);
      return { success: false, error: error.message };
    }
  }

  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Mesmo com emulador, sincronizar perfil
      await this.syncWithPinubi(result.user);
      
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async syncWithPinubi(firebaseUser, googleData = null) {
    try {
      // Esta função roda no EMULATOR mesmo com Auth real
      const updateUserProfile = httpsCallable(functions, 'updateUserProfile');
      
      const profileData = {
        displayName: firebaseUser.displayName || googleData?.user?.name,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || googleData?.user?.photo,
        provider: googleData ? 'google' : 'email',
        isActive: true,
      };

      const result = await updateUserProfile(profileData);
      console.log('✅ Usuário sincronizado com Pinubi (emulator):', result.data);
      
      return result;
    } catch (error) {
      console.error('⚠️ Erro ao sincronizar com Pinubi:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      if (await GoogleSignin.isSignedIn()) {
        await GoogleSignin.signOut();
      }
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// ===========================
// HOOK DE AUTENTICAÇÃO
// ===========================

export const useHybridAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authService] = useState(() => new HybridAuthService());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      return await authService.signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email, password) => {
    setLoading(true);
    try {
      return await authService.signInWithEmail(email, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      return await authService.signOut();
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    logout,
    isAuthenticated: !!user,
    canUseGoogle: USE_GOOGLE_SIGNIN
  };
};

// ===========================
// FUNCTIONS SERVICE (EMULATOR)
// ===========================

export class PinubiHybridService {
  constructor() {
    this.functions = functions; // Conectado ao emulator
  }

  async getUserLocation() {
    try {
      const getUserLocation = httpsCallable(this.functions, 'getUserLocation');
      const result = await getUserLocation();
      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateUserLocation(location, address) {
    try {
      const updateUserLocation = httpsCallable(this.functions, 'updateUserLocation');
      const result = await updateUserLocation({ location, address });
      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async findNearbyPlaces(latitude, longitude, radius = 5) {
    try {
      const findNearbyPlaces = httpsCallable(this.functions, 'findNearbyPlaces');
      const result = await findNearbyPlaces({ latitude, longitude, radius });
      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export const pinubiHybrid = new PinubiHybridService();

// ===========================
// COMPONENTE DE EXEMPLO
// ===========================

import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Image } from 'react-native';

export const HybridExample = () => {
  const { 
    user, 
    loading, 
    signInWithGoogle, 
    signInWithEmail, 
    logout,
    canUseGoogle 
  } = useHybridAuth();

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    
    if (result.success) {
      Alert.alert(
        'Sucesso!', 
        `Bem-vindo via Google, ${result.user.displayName}!\n\n` +
        `Auth: Real\nFunctions: Emulator\nFirestore: Emulator`
      );
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  const handleEmailSignIn = async () => {
    const result = await signInWithEmail('user1@test.com', 'password123');
    
    if (result.success) {
      Alert.alert(
        'Sucesso!', 
        `Login com email realizado!\n\n` +
        `Auth: ${USE_GOOGLE_SIGNIN ? 'Real' : 'Emulator'}\n` +
        `Functions: Emulator\nFirestore: Emulator`
      );
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  const handleTestFunction = async () => {
    const result = await pinubiHybrid.updateUserLocation(
      { lat: -23.5505, lng: -46.6333, accuracy: 15 },
      'Centro, São Paulo, SP, Brasil'
    );
    
    if (result.success) {
      Alert.alert('Sucesso!', 'Função executada no emulator!');
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pinubi Hybrid Auth</Text>
        
        <Text style={styles.subtitle}>
          Modo: {USE_GOOGLE_SIGNIN ? 'Auth Real + Functions Emulator' : 'Emulators Only'}
        </Text>
        
        {canUseGoogle && (
          <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleSignIn}>
            <Text style={styles.buttonText}>🚀 Login com Google</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={[styles.button, styles.emailButton]} onPress={handleEmailSignIn}>
          <Text style={styles.buttonText}>
            📧 Login Email {!USE_GOOGLE_SIGNIN ? '(Emulator)' : '(Real)'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.info}>
          {USE_GOOGLE_SIGNIN 
            ? 'Google: Produção | Functions: Desenvolvimento'
            : 'Tudo: Desenvolvimento (user1@test.com / password123)'
          }
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Conectado!</Text>
      
      {user.photoURL && (
        <Image source={{ uri: user.photoURL }} style={styles.avatar} />
      )}
      
      <Text style={styles.userInfo}>Nome: {user.displayName || 'N/A'}</Text>
      <Text style={styles.userInfo}>Email: {user.email}</Text>
      <Text style={styles.userInfo}>
        Provider: {user.providerData[0]?.providerId || 'email'}
      </Text>
      
      <TouchableOpacity style={[styles.button, styles.testButton]} onPress={handleTestFunction}>
        <Text style={styles.buttonText}>🧪 Testar Function (Emulator)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={logout}>
        <Text style={styles.buttonText}>🚪 Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: '#666',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 8,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  emailButton: {
    backgroundColor: '#34A853',
  },
  testButton: {
    backgroundColor: '#FF9800',
  },
  logoutButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  userInfo: {
    fontSize: 16,
    marginVertical: 3,
    color: '#333',
  },
  info: {
    fontSize: 12,
    marginTop: 15,
    textAlign: 'center',
    color: '#666',
  },
});

export default {
  useHybridAuth,
  PinubiHybridService,
  pinubiHybrid,
  HybridExample
};

// ===========================
// INSTRUÇÕES DE USO
// ===========================

/*
📖 COMO USAR:

1. PARA GOOGLE SIGN-IN + EMULATORS:
   - Configure USE_GOOGLE_SIGNIN = true
   - Use firebaseConfig REAL (seu projeto)
   - Configure Google Sign-In no Firebase Console
   - Functions rodam no emulator local

2. PARA DESENVOLVIMENTO APENAS:
   - Configure USE_GOOGLE_SIGNIN = false  
   - Use firebaseConfigEmulatorOnly
   - Tudo roda em emuladores locais
   - Use user1@test.com / password123

3. VANTAGENS HÍBRIDAS:
   ✅ Google Sign-In real funciona
   ✅ Functions em desenvolvimento
   ✅ Dados locais no Firestore
   ✅ Sincronização automática
*/
