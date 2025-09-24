import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { sharingService } from '@/services/sharingService';

/**
 * Hook to handle deep links when app is opened via URL
 */
export const useDeepLinking = () => {
  const router = useRouter();

  useEffect(() => {
    // Handle initial URL when app is opened from a cold start
    const handleInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          handleIncomingUrl(initialUrl);
        }
      } catch (error) {
        console.error('Error getting initial URL:', error);
      }
    };

    // Handle URLs when app is already running
    const handleUrlEvent = (event: { url: string }) => {
      handleIncomingUrl(event.url);
    };

    // Set up listeners
    handleInitialUrl();
    const subscription = Linking.addEventListener('url', handleUrlEvent);

    // Cleanup
    return () => {
      subscription?.remove();
    };
  }, []);

  const handleIncomingUrl = (url: string) => {
    console.log('🔗 Handling incoming URL:', url);

    // Check if it's a valid Pinubi share URL
    if (!sharingService.isValidShareUrl(url)) {
      console.log('❌ Not a valid Pinubi share URL');
      return;
    }

    // Parse the URL to get type and ID
    const parsed = sharingService.parseShareUrl(url);
    
    if (parsed.type === 'list' && parsed.id) {
      console.log('📋 Navigating to shared list:', parsed.id);
      router.push(`/(public)/share/${parsed.id}`);
    } else if (parsed.type === 'place' && parsed.id) {
      console.log('📍 Navigating to shared place:', parsed.id);
      // TODO: Implement place sharing route when needed
      console.log('Place sharing not implemented yet');
    } else {
      console.log('❌ Invalid share URL format');
    }
  };

  return {
    handleIncomingUrl,
  };
};