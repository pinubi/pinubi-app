import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithCredential,
  updateProfile
} from 'firebase/auth';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { auth } from '@/config/firebase';
import type { AuthError, AuthStore, User } from '@/types/auth';
import { getUserValidationStatus, mapFirebaseUserWithValidation } from '@/utils/firestoreHelpers';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Note: Using real GoogleSignin - requires development build or production build
// For Expo Go testing, use signInWithMock() instead

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB, // Web Client ID from Google Cloud Console
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS, // iOS Client ID from GoogleService-Info.plist
  offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
  scopes: ['profile', 'email'], // what API you want to access on behalf of the user, default is email and profile
});

const mapFirebaseUserToUser = (firebaseUser: any): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  name: firebaseUser.displayName || '',
  photo: firebaseUser.photoURL,
  givenName: firebaseUser.displayName?.split(' ')[0],
  familyName: firebaseUser.displayName?.split(' ').slice(1).join(' '),
  createdAt: firebaseUser.metadata?.creationTime,
  // New users start as not validated/active - per PLANEJAMENTO_JORNADAS_USUARIO.md
  isValidated: false,
  isActive: false,
  onboardingComplete: false,
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

const mapFirebaseAuthErrorToAuthError = (error: any): AuthError => {
  const errorCode = error.code;
  
  console.log('Firebase Auth Error:', { code: errorCode, message: error.message });
  
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/invalid-password':
      return 'invalid_credentials';
    case 'auth/user-not-found':
      return 'user_not_found';
    case 'auth/wrong-password':
      return 'wrong_password';
    case 'auth/too-many-requests':
      return 'too_many_requests';
    case 'auth/user-disabled':
      return 'user_disabled';
    case 'auth/network-request-failed':
      return 'network_error';
    default:
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
    case 'invalid_credentials':
      return 'Email ou senha incorretos';
    case 'user_not_found':
      return 'Usuário não encontrado';
    case 'wrong_password':
      return 'Senha incorreta';
    case 'too_many_requests':
      return 'Muitas tentativas. Tente novamente mais tarde';
    case 'user_disabled':
      return 'Conta desabilitada. Entre em contato com o suporte';
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
          
          // Check if sign-in was successful
          if (userInfo.type !== 'success') {
            throw new Error('Google Sign-In was cancelled or failed');
          }
          
          if (!userInfo.data.idToken) {
            throw new Error('No ID token received from Google Sign-In');
          }

          // Create Firebase credential
          const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);

          // Sign in to Firebase
          const userCredential = await signInWithCredential(auth, googleCredential);
          
          console.log('Firebase sign-in successful:', userCredential.user.uid);
          
          // Get user validation status from Firestore
          console.log('Fetching user validation status from Firestore...');
          const validationStatus = await getUserValidationStatus(userCredential.user.uid);
          
          // Map Firebase user with Firestore validation data
          const user = mapFirebaseUserWithValidation(userCredential.user, validationStatus);
          
          console.log('GoogleSignIn: User authentication complete:', {
            userId: user.id,
            email: user.email,
            isValidated: user.isValidated,
            isActive: user.isActive,
            onboardingComplete: user.onboardingComplete,
            canAccessProtected: user.isValidated && user.isActive
          });
          
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

      signInWithEmailAndPassword: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });

          console.log('Firebase email/password sign-in started for:', email);

          // Sign in with Firebase
          const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
          
          console.log('Firebase email/password sign-in successful:', userCredential.user.uid);
          
          // Get user validation status from Firestore
          console.log('Fetching user validation status from Firestore...');
          const validationStatus = await getUserValidationStatus(userCredential.user.uid);
          
          // Map Firebase user with Firestore validation data
          const user = mapFirebaseUserWithValidation(userCredential.user, validationStatus);
          
          console.log('EmailSignIn: User authentication complete:', {
            userId: user.id,
            email: user.email,
            isValidated: user.isValidated,
            isActive: user.isActive,
            onboardingComplete: user.onboardingComplete,
            canAccessProtected: user.isValidated && user.isActive
          });
          
          set({
            user,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Email/Password Sign-In Error:', error);
          
          const authError = mapFirebaseAuthErrorToAuthError(error);
          const errorMessage = getErrorMessage(authError);
          
          set({
            loading: false,
            error: errorMessage,
            user: null,
            isAuthenticated: false,
          });
        }
      },

      signUpWithEmailAndPassword: async (
        email: string, 
        password: string, 
        userData: {
          displayName: string;
          inviteCode: string;
          preferences: {
            categories: string[];
            priceRange: [number, number];
            dietaryRestrictions: string[];
          };
          location: {
            country: string;
            state: string;
            city: string;
          };
        }
      ) => {
        try {
          set({ loading: true, error: null });

          console.log('Firebase email/password signup started for:', email);

          // Create user with Firebase Auth
          const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
          
          console.log('Firebase user created successfully:', userCredential.user.uid);

          // Update the user's display name
          await updateProfile(userCredential.user, {
            displayName: userData.displayName,
          });

          console.log('User profile updated with display name:', userData.displayName);

          // Get user validation status from Firestore (for new users this will be defaults)
          console.log('Fetching initial user validation status from Firestore...');
          const validationStatus = await getUserValidationStatus(userCredential.user.uid);
          
          // Map Firebase user with Firestore validation data
          const user = mapFirebaseUserWithValidation(userCredential.user, validationStatus);
          
          console.log('EmailSignUp: User registration complete:', {
            userId: user.id,
            email: user.email,
            displayName: userData.displayName,
            isValidated: user.isValidated,
            isActive: user.isActive,
            onboardingComplete: user.onboardingComplete,
            canAccessProtected: user.isValidated && user.isActive
          });
          
          set({
            user,
            isAuthenticated: true,
            loading: false,
            error: null,
          });

          console.log('User registration completed successfully');
        } catch (error: any) {
          console.error('Email/Password Sign-Up Error:', error);
          
          const authError = mapFirebaseAuthErrorToAuthError(error);
          let errorMessage = getErrorMessage(authError);

          // Handle specific signup errors
          if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email já está em uso. Tente fazer login ou use outro email.';
          } else if (error.code === 'auth/weak-password') {
            errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email inválido. Verifique o formato do email.';
          }
          
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
            createdAt: new Date().toISOString(),
            // Mock users start as not validated/active for testing onboarding flow
            isValidated: false,
            isActive: false,
            onboardingComplete: false,
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
            console.log('Signing out mock user');
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
              error: null,
            });
            return;
          }

          // For real Firebase users, sign out properly
          try {
            // Sign out from Google (if available)
            await GoogleSignin.signOut();
          } catch (error) {
            // Google sign out might fail if user wasn't signed in via Google
            console.log('Google sign out not needed or failed:', error);
          }

          // Sign out from Firebase
          await firebaseSignOut(auth);
          
          console.log('Successfully signed out from Firebase');

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
          const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('Firebase auth state changed:', firebaseUser?.uid || 'no user');
            
            if (firebaseUser) {
              // Get user validation status from Firestore
              console.log('Fetching user validation status from Firestore for auth state...');
              const validationStatus = await getUserValidationStatus(firebaseUser.uid);
              
              // Map Firebase user with Firestore validation data
              const user = mapFirebaseUserWithValidation(firebaseUser, validationStatus);
              
              console.log('AuthState: Setting authenticated user with validation:', {
                userId: user.id,
                email: user.email,
                isValidated: user.isValidated,
                isActive: user.isActive,
                onboardingComplete: user.onboardingComplete,
                canAccessProtected: user.isValidated && user.isActive
              });
              
              set({
                user,
                isAuthenticated: true,
                loading: false,
                error: null,
              });
            } else {
              console.log('No Firebase user found, setting unauthenticated state');
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

      // Update user validation status after completing onboarding
      updateUserValidation: (isValidated: boolean, isActive: boolean, onboardingComplete: boolean = true) => {
        const currentUser = get().user;
        console.log('AuthStore: updateUserValidation called with:', {
          isValidated,
          isActive,
          onboardingComplete,
          currentUser: currentUser ? {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
            currentIsValidated: currentUser.isValidated,
            currentIsActive: currentUser.isActive,
          } : null
        });
        
        if (currentUser) {
          const updatedUser: User = {
            ...currentUser,
            isValidated,
            isActive,
            onboardingComplete,
          };
          
          set({ user: updatedUser });
          
          console.log('AuthStore: User validation status updated:', {
            isValidated,
            isActive,
            onboardingComplete,
            updatedUser: {
              id: updatedUser.id,
              email: updatedUser.email,
              isValidated: updatedUser.isValidated,
              isActive: updatedUser.isActive,
              onboardingComplete: updatedUser.onboardingComplete,
            }
          });
        } else {
          console.log('AuthStore: Cannot update validation - no current user');
        }
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
