# MapView Implementation - Mobile Only

## Overview
Successfully implemented MapView functionality in the discover screen using `react-native-maps` and `expo-location` for iOS and Android platforms.

## Features Implemented

### 1. MapView Component (`/src/components/PinubiMapView.tsx`)
- **Custom location hook**: Uses `expo-location` to get user's current position
- **Permission handling**: Requests and handles location permissions with Brazilian Portuguese messages
- **Custom marker**: Displays user's location without native `showsUserLocation` prop
- **Error handling**: Shows meaningful error messages and retry options
- **Loading states**: Displays loading indicator while fetching location
- **Refresh button**: Allows users to manually refresh their location
- **Custom styling**: Light theme with purple accents matching Pinubi's design system

### 2. Location Hook (`/src/hooks/useLocation.ts`)
- **Permission management**: Handles location permission requests
- **Current position**: Gets high-accuracy current location
- **Error handling**: Comprehensive error management with Brazilian Portuguese messages
- **Refresh functionality**: Allows manual location updates
- **TypeScript support**: Fully typed for better development experience

### 3. Integration with Discover Screen
- **View mode switching**: MapView appears when 'map' mode is selected in ViewModeDropdown
- **Seamless integration**: Works with existing header and filter tabs
- **Responsive design**: Adapts to different screen sizes

### 4. Configuration Updates
- **App.json**: Added location permissions for both iOS and Android (removed web config)
- **Dependencies**: Installed `react-native-maps@1.20.1` and `expo-location@18.1.6`

## Technical Details

### Platform Support
- **iOS**: Full support with MapKit
- **Android**: Full support with Google Maps
- **Web**: Not supported (mobile-only app)

### Permissions
- **iOS**: `NSLocationWhenInUseUsageDescription` configured
- **Android**: `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` permissions added
- **Expo plugin**: `expo-location` plugin configured with Brazilian Portuguese permission messages

### Map Configuration
- **Initial region**: Centered on user's location with 0.01 delta for close zoom
- **Map type**: Standard map view
- **Features enabled**: Compass, scale, buildings, indoor maps, points of interest
- **Features disabled**: Native user location, my location button, traffic (using custom implementation)
- **Custom styling**: Light purple-themed map style matching Pinubi's design system

### Custom Map Styling
- **Background**: Light gray (#fafafa) for general geometry
- **Text**: Dark gray (#3f3f46) for labels with white stroke
- **Roads**: Purple highways (#e6ccff) with purple strokes (#b13bff)
- **Water**: Light purple (#d9b3ff) matching app theme
- **POIs**: Light purple background (#f0f0ff) with dark purple text (#7b23b3)
- **Administrative areas**: Light gray with subtle borders

### Custom Marker Design
- **Visual**: Purple circle with white dot center, matching app's primary color (#b13bff)
- **Glow effect**: Semi-transparent purple outer ring for better visibility
- **Border**: White border with shadow for better contrast
- **Title**: "Você está aqui" (You are here)
- **Description**: "Sua localização atual" (Your current location)

### Error Handling
- **Permission denied**: Shows clear message with retry button
- **Location unavailable**: Displays appropriate error message
- **Network issues**: Graceful fallback with retry option
- **All error states**: Consistent purple theme and Brazilian Portuguese messages

## Usage

1. **Switch to Map View**: Use the ViewModeDropdown in the header to select 'Mapa'
2. **Grant Permissions**: Allow location access when prompted
3. **View Location**: Your current location will be centered on the map with a custom marker
4. **Refresh Location**: Tap the locate button in the bottom-right corner to refresh

## Code Structure

```
src/
├── components/
│   └── PinubiMapView.tsx     # Main MapView component (mobile-only)
├── hooks/
│   └── useLocation.ts        # Location management hook
└── app/(protected)/(tabs)/
    └── discover.tsx          # Updated discover screen
```

## Dependencies

- `react-native-maps`: For map functionality (iOS/Android only)
- `expo-location`: For location services
- `@expo/vector-icons`: For UI icons

## Styling

- Uses Tailwind CSS classes via NativeWind
- Custom map style with purple theme matching Pinubi's design system
- Primary color (#b13bff) used throughout for consistency
- Responsive design with proper shadow and spacing
- Brazilian Portuguese labels and messages

## Future Enhancements

1. **Add place markers**: Show nearby places on the map
2. **Clustering**: Group nearby markers for better performance
3. **Search functionality**: Allow users to search for specific locations
4. **Advanced map controls**: Zoom controls, map type switcher
5. **Offline support**: Cache map tiles for offline usage
6. **Dark mode**: Support for dark theme variant
