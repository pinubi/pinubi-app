import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { GoogleAuthProvider, signOut as firebaseSignOut, onAuthStateChanged, signInWithCredential } from 'firebase/auth';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { auth } from '@/config/firebase';
import type { AuthError, AuthStore, User } from '@/types/auth';
import { GoogleSignin } from '@/utils/googleSigninMock';

// Note: Using mock GoogleSignin for Expo Go compatibility
// For production builds, replace with actual GoogleSignin import

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '500010338081-0lf4cu0bvbiuki6i6m23gi2f7o33mp7s.apps.googleusercontent.com', // Web Client ID from Google Cloud Console
  iosClientId: '500010338081-7egmh23t3cpk80b5knn7u9hb2aq9hh2r.apps.googleusercontent.com', // iOS Client ID from GoogleService-Info.plist
});

console.log('Google Sign-In configured with:');
console.log('- webClientId:', '500010338081-0lf4cu0bvbiuki6i6m23gi2f7o33mp7s.apps.googleusercontent.com');
console.log('- iosClientId:', '500010338081-7egmh23t3cpk80b5knn7u9hb2aq9hh2r.apps.googleusercontent.com');

const mapFirebaseUserToUser = (firebaseUser: any): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  name: firebaseUser.displayName || '',
  photo: firebaseUser.photoURL,
  givenName: firebaseUser.displayName?.split(' ')[0],
  familyName: firebaseUser.displayName?.split(' ').slice(1).join(' '),
});

const mapGoogleSignInErrorToAuthError = (error: any): AuthError => {
  const errorCode = error.code;
  const errorMessage = error.message;
  
  console.log('Error details:', { code: errorCode, message: errorMessage });
  
  switch (errorCode) {
    case 'sign_in_cancelled':
    case 'SIGN_IN_CANCELLED':
      return 'sign_in_cancelled';
    case 'sign_in_required':
    case 'SIGN_IN_REQUIRED':
      return 'sign_in_required';
    case 'network_error':
    case 'NETWORK_ERROR':
      return 'network_error';
    case 'developer_error':
    case 'DEVELOPER_ERROR':
      return 'developer_error';
    default:
      // Check message for common patterns
      if (errorMessage?.includes('cancelled') || errorMessage?.includes('canceled')) {
        return 'sign_in_cancelled';
      }
      if (errorMessage?.includes('network') || errorMessage?.includes('connection')) {
        return 'network_error';
      }
      return 'unknown_error';
  }
};

const getErrorMessage = (error: AuthError): string => {
  switch (error) {
    case 'sign_in_cancelled':
      return 'Login cancelado pelo usuário';
    case 'sign_in_required':
      return 'Login obrigatório';
    case 'network_error':
      return 'Erro de rede. Verifique sua conexão';
    case 'developer_error':
      return 'Erro de configuração. Tente novamente';
    case 'unknown_error':
    default:
      return 'Ocorreu um erro inesperado';
  }
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,

      signInWithGoogle: async () => {
        try {
          set({ loading: true, error: null });

          // Check if we're in a development build with native modules
          const isExpoGo = Constants.appOwnership === 'expo';
          
          if (isExpoGo) {
            throw new Error('Google Sign-In não está disponível no Expo Go. Para testar esta funcionalidade, use um development build ou teste em um simulador/dispositivo com o app compilado.');
          }

          // Check if device supports Google Play Services (Android only)
          // On iOS, this will be skipped automatically
          try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
          } catch (err) {
            // On iOS, this will fail but that's expected - continue with sign in
            console.log('Play Services check (expected to fail on iOS):', err);
          }

          // Get user info from Google
          const userInfo = await GoogleSignin.signIn();
          
          console.log('Google Sign-In userInfo:', userInfo);
          
          if (!userInfo.data?.idToken) {
            throw new Error('No ID token received from Google Sign-In');
          }

          // Create Firebase credential
          const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);

          // Sign in to Firebase
          const userCredential = await signInWithCredential(auth, googleCredential);
          
          console.log('Firebase sign-in successful:', userCredential.user.uid);
          
          const user = mapFirebaseUserToUser(userCredential.user);
          
          set({
            user,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Google Sign-In Error:', error);
          
          const authError = mapGoogleSignInErrorToAuthError(error);
          const errorMessage = getErrorMessage(authError);
          
          set({
            loading: false,
            error: errorMessage,
            user: null,
            isAuthenticated: false,
          });
        }
      },

      // Mock sign-in for Expo Go testing
      signInWithMock: async () => {
        try {
          console.log('Mock sign-in: Iniciando...');
          set({ loading: true, error: null });

          // Check if we're in Expo Go
          const isExpoGo = Constants.appOwnership === 'expo';
          
          if (!isExpoGo) {
            throw new Error('Mock sign-in só está disponível no Expo Go');
          }

          // Create a mock user for testing
          const mockUser: User = {
            id: 'mock-user-123',
            email: 'usuario.teste@exemplo.com',
            name: 'Usuário de Teste',
            photo: 'https://via.placeholder.com/150/4285F4/FFFFFF?text=UT',
            givenName: 'Usuário',
            familyName: 'de Teste',
          };

          console.log('Mock sign-in: Definindo usuário mock:', mockUser);

          set({
            user: mockUser,
            isAuthenticated: true,
            loading: false,
            error: null,
          });

          console.log('Mock sign-in: Estado atualizado - isAuthenticated: true, user:', mockUser.name);
        } catch (error: any) {
          console.error('Mock Sign-In Error:', error);
          set({
            loading: false,
            error: 'Erro no login de teste',
            user: null,
            isAuthenticated: false,
          });
        }
      },

      signOut: async () => {
        try {
          set({ loading: true, error: null });

          // Check if we're using mock user
          const currentUser = get().user;
          if (currentUser?.id === 'mock-user-123') {
            // Just clear the mock user
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
              error: null,
            });
            return;
          }

          // Sign out from Google
          await GoogleSignin.signOut();

          // Sign out from Firebase
          await firebaseSignOut(auth);

          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Sign Out Error:', error);
          set({
            loading: false,
            error: 'Falha ao sair. Tente novamente.',
          });
        }
      },

      checkAuthState: async () => {
        try {
          // Listen to Firebase auth state changes
          const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log('Firebase auth state changed:', firebaseUser?.uid || 'no user');
            
            // Don't override mock authentication
            const currentState = get();
            if (currentState.user?.id === 'mock-user-123') {
              console.log('Mantendo autenticação mock, ignorando Firebase auth state');
              return;
            }
            
            if (firebaseUser) {
              const user = mapFirebaseUserToUser(firebaseUser);
              set({
                user,
                isAuthenticated: true,
                loading: false,
                error: null,
              });
            } else {
              set({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null,
              });
            }
          });

          // Return unsubscribe function for cleanup if needed
          return unsubscribe;
        } catch (error: any) {
          console.error('Auth State Check Error:', error);
          set({
            loading: false,
            error: 'Failed to check authentication state',
            user: null,
            isAuthenticated: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
