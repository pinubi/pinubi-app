# 🎯 **TASK: Implement Google Authentication with Firebase (iOS Only)**

## **Context**
You are working on a React Native Expo job board app called "pinubi-app" that needs Google authentication using Firebase. The app uses:
- **Expo** (React Native)
- **bun** as package manager  
- **NativeWind + TailwindCSS** for styling
- **TypeScript** (strict mode)
- **Expo Router** for navigation
- **Zustand** for state management

## **Current State**
✅ Firebase config exists (`src/config/firebase.ts`)
✅ GoogleService-Info.plist configured for iOS
✅ Basic app structure with (public) and (protected) routes
✅ Mock login screen at `(public)/login.tsx`
✅ @react-native-google-signin package exists in node_modules
❌ Package not in package.json (needs proper installation)
❌ No auth state management
❌ No route protection

## **Requirements**

### **1. Package Management**
- Add `@react-native-google-signin/google-signin` to package.json with correct version
- Install any additional required dependencies using `bun`
- Focus on iOS compatibility only for now

### **2. Authentication Store (Zustand)**
Create `src/store/authStore.ts` with:
- User state (user object, loading, error)
- Actions: signInWithGoogle, signOut, checkAuthState
- Persist auth state using AsyncStorage
- TypeScript interfaces for user data

### **3. Authentication Types**
Create `src/types/auth.ts` with:
- User interface
- Auth state interface
- Auth store interface
- Error types

### **4. Authentication Hook**
Create `src/hooks/useAuth.ts` that:
- Wraps the auth store
- Provides easy access to auth state and actions
- Handles auth state persistence

### **5. Google Sign-In Implementation**
Update `src/app/(public)/login.tsx` to:
- Use real Google Sign-In with Firebase
- Handle loading states with proper UX
- Show error messages for auth failures
- Navigate to protected routes on success
- Use @react-native-google-signin/google-signin package

### **6. Route Protection**
Create auth guard in `src/app/(protected)/_layout.tsx`:
- Check auth state on mount
- Redirect to login if not authenticated
- Show loading spinner while checking auth

### **7. Auto-redirect Logic**
Update `src/app/index.tsx`:
- Check if user is authenticated
- Redirect to appropriate route (login vs protected)
- Handle initial app loading state

### **8. Logout Functionality**
Add logout button to `src/app/(protected)/(tabs)/discover.tsx`:
- Clear auth state and redirect to login
- Show confirmation dialog
- Handle logout loading state

### **9. Error Handling & UX**
- Proper error messages for auth failures
- Loading states during sign-in/sign-out
- Network error handling
- User feedback for all auth actions

## **Technical Requirements**
- ✅ Use TypeScript (.tsx for components)
- ✅ Use functional components with React Hooks
- ✅ Style with Tailwind classes via NativeWind (`className=""`)
- ✅ Use `bunx` instead of `npx` for commands
- ✅ Must compile and run with `bunx expo start`
- ✅ Follow existing code patterns and file structure
- ✅ No inline styles or StyleSheet API
- ✅ Modular, reusable, and maintainable code
- ✅ **iOS ONLY** - Android will be implemented later

## **Deliverables**
1. Updated package.json with `@react-native-google-signin/google-signin`
2. Auth types (`src/types/auth.ts`)
3. Auth store with Zustand (`src/store/authStore.ts`)
4. Auth hook (`src/hooks/useAuth.ts`)
5. Updated login screen with real Google auth
6. Protected route layout with auth guard
7. Updated index.tsx with proper routing logic
8. Logout functionality in discover screen
9. Error handling throughout

## **iOS-Specific Configuration**
- Ensure GoogleService-Info.plist is properly linked
- Configure URL schemes in app.json if needed
- Test with iOS Simulator and physical device
- Verify Google Sign-In button follows iOS design guidelines

## **Testing Checklist (iOS Only)**
- [ ] Google Sign-In works in iOS Simulator
- [ ] Google Sign-In works on physical iOS device
- [ ] Auth state persists after app restart
- [ ] Protected routes are actually protected
- [ ] Logout works and redirects properly
- [ ] Loading states show during auth operations
- [ ] Error messages display for auth failures
- [ ] App doesn't crash on network issues
- [ ] Proper iOS navigation behavior

## **Implementation Notes**
- Use Firebase Auth's `signInWithCredential` with Google credentials
- Implement proper error handling for Google Sign-In specific errors
- Follow iOS Human Interface Guidelines for button styling
- Test with different iOS versions if possible
- Use expo-dev-client for proper testing of native modules

## **Android Future Implementation**
Note: Android configuration will be implemented in a future iteration and will require:
- google-services.json file
- SHA-1 fingerprint configuration
- Android-specific app.json updates
- Testing on Android devices/emulators