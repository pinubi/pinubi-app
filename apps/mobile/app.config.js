import 'dotenv/config';

export default {
  expo: {
    name: "pinubi-app",
    slug: "pinubi-app",
    version: "1.1.0",
    orientation: "portrait",
    icon: "./src/assets/images/icon.png",
    scheme: "pinubiapp",
    userInterfaceStyle: "light",
    // Deep linking configuration
    assetBundlePatterns: [
      "**/*"
    ],
    web: {
      bundler: "metro"
    },
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "www.pinubi.com",
            pathPrefix: "/share"
          },
          {
            scheme: "https", 
            host: "pinubi.com",
            pathPrefix: "/share"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ],
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.awmoreira.pinubiapp",
      buildNumber: "2",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Este aplicativo precisa de acesso à sua localização para mostrar lugares próximos a você.",
        CFBundleURLTypes: [
          {
            CFBundleURLName: "google",
            CFBundleURLSchemes: ["com.googleusercontent.apps.500010338081-7egmh23t3cpk80b5knn7u9hb2aq9hh2r"]
          }
        ]
      },
      config: {
        googleMapsApiKey: "AIzaSyBWk8hTBPSPT6xrt4DS6JY0m677uegY9rM"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./src/assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.awmoreira.pinubiapp",
      versionCode: 2,
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_MEDIA_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_MEDIA_LOCATION"
      ]
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./src/assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#fafafa"
        }
      ],
      "expo-font",
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "16.0"
          }
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Este aplicativo precisa de acesso à sua localização para mostrar lugares próximos a você.",
          locationWhenInUsePermission: "Este aplicativo precisa de acesso à sua localização para mostrar lugares próximos a você."
        }
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
          savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos.",
          isAccessMediaLocationEnabled: true
        }
      ],
      [
        "@react-native-google-signin/google-signin"
      ],
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "97487242-b533-43e9-a56c-cc27ed7fa846"
      },
      // Firebase configuration - safely load from environment with fallbacks
      firebaseConfig: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
      },
      // Google OAuth configuration
      googleConfig: {
        clientIdIOS: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || "",
        clientIdAndroid: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || "",
        clientIdWeb: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || "",
      },
      // Other configuration
      debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === "true",
      googlePlacesApiKey: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || "",
    },
    owner: "awmoreira",
    runtimeVersion: "1.0.0",
    updates: {
      enabled: false,
      checkAutomatically: "NEVER",
      fallbackToCacheTimeout: 0      
    }
  }
};