export interface User {
  id: string;
  email: string;
  name: string;
  photo: string | null;
  familyName?: string;
  givenName?: string;
  createdAt: string;
  // Onboarding and validation states
  isValidated?: boolean;  // Has valid invite code
  isActive?: boolean;     // Has completed onboarding
  onboardingComplete?: boolean; // Completed all onboarding steps
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
  signUpWithEmailAndPassword: (
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
  ) => Promise<void>;
  signInWithMock: () => Promise<void>;
  signOut: () => Promise<void>;
  checkAuthState: () => Promise<(() => void) | undefined>;
  clearError: () => void;
  updateUserValidation: (isValidated: boolean, isActive: boolean, onboardingComplete?: boolean) => void;
  resetPassword: (email: string) => Promise<void>;
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
  | 'password_reset_sent'
  | 'password_reset_failed'
  | 'unknown_error';
