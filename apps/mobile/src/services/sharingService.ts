import { Share } from 'react-native';


/**
 * Service for handling sharing functionality across the app
 * Provides consistent URL generation and sharing logic
 */
class SharingService {
  private readonly baseUrl = 'https://www.pinubi.com';

  /**
   * Generate a shareable URL for a list
   */
  generateListShareUrl(listId: string): string {
    return `${this.baseUrl}/share/${listId}`;
  }

  /**
   * Generate a shareable URL for a place
   */
  generatePlaceShareUrl(placeId: string): string {
    return `${this.baseUrl}/place/${placeId}`;
  }

  /**
   * Share a list with proper formatting
   */
  async shareList(list: {
    id: string;
    title: string;
    description?: string;
    placesCount: number;
    visibility: 'public' | 'private';
  }): Promise<boolean> {
    try {
      const shareUrl = this.generateListShareUrl(list.id);
      
      // Create a nice share message
      let message = `Confira a minha lista no Pinubi: "${list.title}"`;
      
      if (list.description) {
        message += `\n\n${list.description}`;
      }
      
      message += `\n\n📍 ${list.placesCount} ${list.placesCount === 1 ? 'lugar' : 'lugares'}`;
      message += `\n🌐 Lista ${list.visibility === 'public' ? 'pública' : 'privada'}`;
      message += `\n\n${shareUrl}`;

      await Share.share({
        message,
        title: list.title,
        url: shareUrl, // This will be used on iOS
      });

      return true;
    } catch (error) {
      console.error('Error sharing list:', error);
      return false;
    }
  }

  /**
   * Share a place with proper formatting
   */
  async sharePlace(place: {
    id: string;
    name: string;
    address?: string;
    rating?: number;
  }): Promise<boolean> {
    try {
      const shareUrl = this.generatePlaceShareUrl(place.id);
      
      let message = `Confira este lugar no Pinubi: ${place.name}`;
      
      if (place.address) {
        message += `\n📍 ${place.address}`;
      }
      
      if (place.rating) {
        message += `\n⭐ ${place.rating}/10.0`;
      }
      
      message += `\n\n${shareUrl}`;

      await Share.share({
        message,
        title: place.name,
        url: shareUrl, // This will be used on iOS
      });

      return true;
    } catch (error) {
      console.error('Error sharing place:', error);
      return false;
    }
  }

  /**
   * Share app invitation
   */
  async shareAppInvitation(customMessage?: string): Promise<boolean> {
    try {
      const message = customMessage || 
        `Descubra lugares incríveis com o Pinubi! 🍽️\n\nCrie listas personalizadas, encontre novos restaurantes e compartilhe suas descobertas.\n\n${this.baseUrl}`;

      await Share.share({
        message,
        title: 'Pinubi - Descubra lugares incríveis',
        url: this.baseUrl,
      });

      return true;
    } catch (error) {
      console.error('Error sharing app invitation:', error);
      return false;
    }
  }

  /**
   * Parse a share URL to extract type and ID
   */
  parseShareUrl(url: string): { type: 'list' | 'place' | null; id: string | null } {
    try {
      const urlObj = new URL(url);
      
      // Handle list shares: /share/listId
      if (urlObj.pathname.startsWith('/share/')) {
        const listId = urlObj.pathname.replace('/share/', '');
        return { type: 'list', id: listId };
      }
      
      // Handle place shares: /place/placeId
      if (urlObj.pathname.startsWith('/place/')) {
        const placeId = urlObj.pathname.replace('/place/', '');
        return { type: 'place', id: placeId };
      }
      
      return { type: null, id: null };
    } catch (error) {
      console.error('Error parsing share URL:', error);
      return { type: null, id: null };
    }
  }

  /**
   * Check if a URL is a valid Pinubi share URL
   */
  isValidShareUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const validHosts = ['pinubi.com', 'www.pinubi.com'];
      const validPaths = ['/share/', '/place/'];
      
      return validHosts.includes(urlObj.hostname) && 
             validPaths.some(path => urlObj.pathname.startsWith(path));
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const sharingService = new SharingService();