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
  | 'unknown_error';
