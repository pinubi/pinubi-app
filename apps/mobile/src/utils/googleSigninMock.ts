// Mock implementation for Expo Go compatibility
// This allows the app to run in Expo Go without Google Sign-In functionality

interface MockGoogleSignInResult {
  data: {
    idToken: string;
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      photo: string;
      familyName: string;
      givenName: string;
    };
  };
}

export const GoogleSignin = {
  configure: (config: any) => {
    console.log('GoogleSignin.configure called with mock implementation');
  },
  
  hasPlayServices: async (options?: any): Promise<boolean> => {
    console.log('GoogleSignin.hasPlayServices called with mock implementation');
    return true;
  },
  
  signIn: async (): Promise<MockGoogleSignInResult> => {
    console.log('GoogleSignin.signIn called with mock implementation');
    throw new Error('Google Sign-In não está disponível no Expo Go. Use um development build para esta funcionalidade.');
  },
  
  signOut: async (): Promise<void> => {
    console.log('GoogleSignin.signOut called with mock implementation');
  },
  
  isSignedIn: async (): Promise<boolean> => {
    console.log('GoogleSignin.isSignedIn called with mock implementation');
    return false;
  },
  
  getCurrentUser: async (): Promise<any> => {
    console.log('GoogleSignin.getCurrentUser called with mock implementation');
    return null;
  },
};
