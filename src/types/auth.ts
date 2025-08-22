export interface User {
  id: string;
  email: string;
  name: string;
  photo: string | null;
  familyName?: string;
  givenName?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface AuthStore extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  signInWithMock: () => Promise<void>;
  signOut: () => Promise<void>;
  checkAuthState: () => Promise<(() => void) | undefined>;
  clearError: () => void;
}

export interface GoogleSignInError {
  code: string;
  message: string;
}

export type AuthError = 
  | 'sign_in_cancelled'
  | 'sign_in_required'
  | 'network_error'
  | 'developer_error'
  | 'invalid_credentials'
  | 'user_not_found'
  | 'wrong_password'
  | 'too_many_requests'
  | 'user_disabled'
  | 'unknown_error';
