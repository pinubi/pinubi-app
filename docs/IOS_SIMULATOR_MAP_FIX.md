# iOS Simulator Red Map Fix Guide

## Problem
The MapView shows a red color in iOS simulator instead of the actual map tiles. This is a common issue with `react-native-maps` on iOS simulators.

## Root Cause
The red map appears because:
1. iOS simulator doesn't have proper Google Maps configuration
2. Missing Google Maps API key for iOS
3. MapView provider configuration issues

## Solution Implemented

### 1. Added Google Maps Configuration to app.json
- Added `googleMapsApiKey` configuration for iOS
- Added `react-native-maps` plugin with API key
- Uses environment variable for secure key management

### 2. Updated MapView Component
- Added explicit provider configuration (`PROVIDER_DEFAULT` for iOS)
- Added loading indicators with proper colors
- Enhanced error handling for map loading issues

### 3. Environment Variable Setup
- Added `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY` to `.env` file
- Secure API key management through environment variables

## Steps to Complete the Fix

### Step 1: Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing one
3. Enable "Maps SDK for iOS" API
4. Create an API key for iOS applications
5. Restrict the API key to your app's bundle identifier: `com.awmoreira.pinubiapp`

### Step 2: Configure the API Key
1. Copy your Google Maps iOS API key
2. Replace `your_google_maps_ios_api_key_here` in `.env` file with your actual key:
   ```
   EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=AIzaSyC_your_actual_api_key_here
   ```

### Step 3: Rebuild the App
Since we modified app.json and added new configurations:
```bash
# Clean and rebuild
bun run ios --clear

# Or if using Expo Go
expo start --clear
```

### Step 4: Test in iOS Simulator
1. Run the app in iOS simulator
2. Navigate to the discover screen
3. Switch to map view
4. The map should now show proper map tiles instead of red color

## Alternative Solutions (if the above doesn't work)

### Option 1: Use Apple Maps (Default Provider)
The current implementation already uses `PROVIDER_DEFAULT` for iOS, which uses Apple Maps and should work in the simulator without requiring a Google Maps API key.

### Option 2: Simulator Location Settings
1. In iOS Simulator, go to Device > Location > Custom Location
2. Set a specific latitude and longitude (e.g., 37.7749, -122.4194 for San Francisco)
3. Restart the app

### Option 3: Use Different Map Type
If the issue persists, you can try changing the `mapType` prop:
- `"standard"` (current)
- `"satellite"`
- `"hybrid"`
- `"terrain"` (Android only)

## Troubleshooting

### If you still see red map:
1. Ensure the API key is valid and has the correct restrictions
2. Check that "Maps SDK for iOS" is enabled in Google Cloud Console
3. Verify the bundle identifier matches in both app.json and Google Cloud Console
4. Try clearing Expo cache: `expo start --clear`
5. Rebuild the app completely

### Console Errors to Look For:
- "Google Maps API key not found"
- "Maps SDK for iOS not enabled"
- "Invalid API key"

## Testing
✅ Physical device with Expo Go: Should work normally (as it currently does)
✅ iOS Simulator: Should now show proper map tiles instead of red color
✅ Android: Should continue working as before

## Notes
- The red map issue is specific to iOS simulators
- Physical devices typically don't have this issue
- Google Maps API key is only needed for iOS if using Google Maps provider
- Apple Maps (default provider) should work without API key but may still show red in some simulator versions
