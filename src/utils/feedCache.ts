import { FeedItem } from '@/types/feed';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'feed_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

interface CacheData {
  items: FeedItem[];
  timestamp: number;
  hasMore: boolean;
}

export const feedCache = {
  /**
   * Salvar items do feed no cache local
   */
  async save(items: FeedItem[], hasMore: boolean): Promise<void> {
    try {
      const cacheData: CacheData = {
        items,
        timestamp: Date.now(),
        hasMore
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('📱 Feed cached successfully');
    } catch (error) {
      console.error('📱 Erro ao salvar cache do feed:', error);
    }
  },

  /**
   * Carregar items do feed do cache local
   */
  async load(): Promise<CacheData | null> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (!cachedData) {
        return null;
      }

      const cacheData: CacheData = JSON.parse(cachedData);
      
      // Verificar se o cache não expirou
      const isExpired = Date.now() - cacheData.timestamp > CACHE_EXPIRY;
      if (isExpired) {
        console.log('📱 Cache do feed expirado, removendo...');
        await this.clear();
        return null;
      }

      console.log('📱 Feed carregado do cache');
      return cacheData;
    } catch (error) {
      console.error('📱 Erro ao carregar cache do feed:', error);
      return null;
    }
  },

  /**
   * Limpar cache do feed
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      console.log('📱 Cache do feed limpo');
    } catch (error) {
      console.error('📱 Erro ao limpar cache do feed:', error);
    }
  },

  /**
   * Verificar se há dados em cache válidos
   */
  async isValid(): Promise<boolean> {
    const cacheData = await this.load();
    return cacheData !== null;
  }
};
