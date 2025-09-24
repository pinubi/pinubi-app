import { useCallback, useEffect, useRef, useState } from 'react';

import { googlePlacesService } from '@/services/googlePlacesService';
import { AutocompleteResult } from '@/types/googlePlaces';
import { debounceAsync } from '@/utils/debounce';

interface UseGooglePlacesAutocompleteOptions {
  /** Delay em ms antes de fazer a busca (default: 300ms) */
  debounceDelay?: number;
  /** Mínimo de caracteres para iniciar busca (default: 3) */
  minCharacters?: number;
  /** Idioma para resultados (default: 'pt-BR') */
  language?: string;
  /** País para restringir busca (default: 'br') */
  country?: string;
}

interface UseGooglePlacesAutocompleteReturn {
  /** Resultados do autocomplete */
  results: AutocompleteResult[];
  /** Estado de carregamento */
  loading: boolean;
  /** Erro da última busca */
  error: string | null;
  /** Função para fazer busca manual */
  search: (query: string) => Promise<void>;
  /** Função para limpar resultados */
  clearResults: () => void;
  /** Função para limpar erro */
  clearError: () => void;
  /** Se a API está disponível */
  isApiAvailable: boolean;
}

export const useGooglePlacesAutocomplete = (
  options: UseGooglePlacesAutocompleteOptions = {}
): UseGooglePlacesAutocompleteReturn => {
  const {
    debounceDelay = 300,
    minCharacters = 3,
    language = 'pt-BR',
    country = 'br',
  } = options;

  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  
  // Ref para controlar cancelamento de requisições
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Função de busca sem debounce
   */
  const performSearch = useCallback(async (query: string) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Validação básica
    if (!query || query.trim().length < minCharacters) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {      
      
      const response = await googlePlacesService.autocomplete({
        input: query.trim(),
        language,
        country,
      });

      if (response.success) {
        setResults(response.results);        
      } else {
        setError(response.error || 'Erro na busca de autocomplete');
        setResults([]);
        console.warn('⚠️ Erro no autocomplete:', response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setResults([]);
      console.error('❌ Erro no autocomplete:', err);
    } finally {
      setLoading(false);
    }
  }, [minCharacters, language, country]);

  /**
   * Função de busca com debounce
   */
  const debouncedSearch = useCallback(
    debounceAsync(performSearch, debounceDelay),
    [performSearch, debounceDelay]
  );

  /**
   * Função pública para busca (com debounce)
   */
  const search = useCallback(
    async (query: string) => {
      try {
        await debouncedSearch(query);
      } catch (error) {
        console.error('Erro na busca com debounce:', error);
      }
    },
    [debouncedSearch]
  );

  /**
   * Limpar resultados
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Verificar disponibilidade da API na montagem
   */
  useEffect(() => {
    let isMounted = true;

    const checkApiAvailability = async () => {
      try {
        const available = await googlePlacesService.isAvailable();
        if (isMounted) {
          setIsApiAvailable(available);          
        }
      } catch {
        if (isMounted) {
          setIsApiAvailable(false);
          console.warn('⚠️ Google Places API não disponível');
        }
      }
    };

    checkApiAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
    clearError,
    isApiAvailable,
  };
};
