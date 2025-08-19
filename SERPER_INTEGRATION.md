# Serper.dev Integration - Places Search

## Overview
Successfully integrated Serper.dev API to search and display nearby places on the map in real-time. Users can discover restaurants, attractions, and other points of interest in their visible map area.

## Features Implemented

### 1. Serper Service (`/src/services/serperService.ts`)
- **API Integration**: Full integration with Serper.dev Maps API
- **Search Methods**: 
  - `searchNearbyPlaces()` - Generic search with custom query
  - `searchRestaurants()` - Search for restaurants
  - `searchAttractions()` - Search for tourist attractions  
  - `searchGeneral()` - Search for interesting places
- **Error Handling**: Comprehensive error management with Portuguese messages
- **Response Parsing**: Converts Serper response to app-specific format
- **TypeScript Support**: Fully typed for better development experience

### 2. Places Hook (`/src/hooks/usePlaces.ts`)
- **State Management**: Manages places, loading, and error states
- **Search Functionality**: Handles search requests and responses
- **Clear Methods**: Provides methods to clear places and errors
- **Loading States**: Tracks search progress for UI feedback

### 3. Enhanced MapView Component (`/src/components/PinubiMapView.tsx`)
- **Dynamic Search Button**: Shows "Buscar na área" when user moves the map
- **Place Markers**: Displays search results as orange markers with ratings
- **Region Tracking**: Monitors map region changes to trigger search availability
- **Interactive Places**: Users can tap on place markers
- **Loading States**: Shows loading indicator during searches
- **Error Display**: Shows error messages with dismiss option

### 4. Types (`/src/types/places.ts`)
- **SerperPlace**: Complete place information structure
- **SerperSearchParams**: Search request parameters
- **SerperResponse**: API response structure
- **MapRegion**: Map region coordinate structure

## Technical Implementation

### API Configuration
- **Base URL**: `https://google.serper.dev/maps`
- **Authentication**: X-API-KEY header
- **Request Format**: POST with JSON body
- **Language**: Portuguese (pt-br)
- **Response Format**: JSON with places array

### Search Behavior
1. **Initial State**: Map shows user location only
2. **User Movement**: When user moves map significantly, "Buscar na área" button appears
3. **Search Trigger**: User taps search button to find places in current view
4. **Results Display**: Places appear as orange markers with ratings
5. **Place Interaction**: Users can tap markers to see place details

### Smart Search Parameters
- **Zoom Level Calculation**: Automatically adjusts search zoom based on map delta
  - Large area (>0.1 delta): Zoom 10 (city level)
  - Medium area (>0.05 delta): Zoom 12 (district level)
  - Small area (<0.005 delta): Zoom 16 (street level)
  - Default: Zoom 14 (neighborhood level)

### Place Marker Design
- **Visual**: Orange circle with location icon
- **Rating Badge**: Shows rating score if available
- **Interaction**: Tappable with place details alert
- **Information**: Title, address, rating, category

### Error Handling
- **Network Errors**: Graceful fallback with retry option
- **API Errors**: User-friendly Portuguese error messages
- **Empty Results**: Handled without breaking the UI
- **Permission Issues**: Clear error states

## Environment Setup

Add to your `.env` file:
```env
EXPO_PUBLIC_SERPER_API_KEY=your_serper_api_key_here
```

Get your API key from: https://serper.dev

## Usage Flow

1. **Open Map**: Switch to map view in discover screen
2. **Move Map**: Pan/zoom to desired area
3. **Search Button**: "Buscar na área" button appears at top center
4. **Search Places**: Tap button to search for places in visible area
5. **View Results**: Orange markers appear showing nearby places
6. **Interact**: Tap any marker to see place details
7. **Reset**: Tap locate button to return to user location

## Integration Points

### Discover Screen (`/src/app/(protected)/(tabs)/discover.tsx`)
- **Place Press Handler**: Shows place details in alert dialog
- **Future Enhancement**: Will connect to place details modal/screen

### MapView Component
- **Props**: `onPlacePress` callback for place interactions
- **State**: Manages search button visibility and place markers
- **Events**: Handles region changes and search triggers

## Place Information Displayed

Each place marker includes:
- **Title**: Place name
- **Address**: Full address
- **Rating**: Star rating (if available)
- **Category**: Place type/category
- **Coordinates**: Latitude/longitude
- **Additional**: Website, phone, hours (when available)

## Performance Considerations

- **Debounced Search**: Search button appears only after significant movement
- **One Request at a Time**: Prevents multiple simultaneous searches
- **Efficient Parsing**: Only valid places with coordinates are processed
- **Memory Management**: Places cleared when returning to user location

## Future Enhancements

1. **Place Details Modal**: Full place information screen
2. **Save Places**: Integration with user's saved places
3. **Filter Options**: Search by specific categories
4. **Clustering**: Group nearby places for better performance
5. **Offline Cache**: Cache recent searches for offline access
6. **Advanced Search**: Custom search queries
7. **Place Photos**: Integration with place images
8. **Reviews**: User reviews and ratings system

## Code Structure

```
src/
├── services/
│   └── serperService.ts      # Serper API integration
├── hooks/
│   └── usePlaces.ts          # Places state management
├── types/
│   └── places.ts             # TypeScript interfaces
├── components/
│   └── PinubiMapView.tsx     # Enhanced MapView with places
└── app/(protected)/(tabs)/
    └── discover.tsx          # Main discover screen
```

## Dependencies

- **Existing**: `react-native-maps`, `expo-location`
- **No New Dependencies**: Uses native fetch API
- **Environment**: Expo environment variables for API key

## Styling

- **Consistent Design**: Follows Pinubi's purple theme
- **Responsive UI**: Adapts to different screen sizes
- **Portuguese Labels**: All UI text in Brazilian Portuguese
- **Accessibility**: Proper contrast and touch targets

## Error Messages (Portuguese)

- "Não foi possível buscar lugares próximos. Tente novamente."
- "Buscando..." (Loading state)
- "Buscar na área" (Search button text)

## API Rate Limits

- Serper.dev provides rate limits based on plan
- Free tier: Limited requests per month
- Error handling includes rate limit management
- Consider implementing request caching for optimization
