import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { listsService } from '@/services/listsService';
import type { AddPlaceToListRequest, ListError, ListPlace, ListPlaceWithDetails } from '@/types/lists';

interface ListPlacesState {
  // State by listId
  placesByListId: Record<string, ListPlaceWithDetails[]>;
  loadingByListId: Record<string, boolean>;
  errorByListId: Record<string, string | null>;
  
  // Actions
  fetchListPlaces: (listId: string) => Promise<void>;
  addPlaceToList: (addPlaceData: AddPlaceToListRequest, userId: string) => Promise<ListPlace | null>;
  removePlaceFromList: (listId: string, placeId: string) => Promise<boolean>;
  clearError: (listId: string) => void;
  refreshListPlaces: (listId: string) => Promise<void>;
  clearListPlaces: (listId: string) => void;
  
  // UI helpers
  getListPlaces: (listId: string) => ListPlaceWithDetails[];
  getListPlacesCount: (listId: string) => number;
  isLoading: (listId: string) => boolean;
  getError: (listId: string) => string | null;
}

const getErrorMessage = (error: ListError): string => {
  switch (error.code) {
    case 'list_not_found':
      return 'Lista não encontrada';
    case 'place_not_found':
      return 'Lugar não encontrado';
    case 'permission_denied':
      return 'Você não tem permissão para realizar esta ação';
    case 'already_exists':
      return 'Este lugar já está na lista';
    case 'resource_exhausted':
      return 'Limite de lugares atingido. Contas gratuitas têm limite de 15 lugares por lista.';
    case 'invalid_data':
      return 'Dados inválidos. Verifique os campos e tente novamente';
    case 'not_authenticated':
      return 'Você precisa estar logado para realizar esta ação';
    case 'network_error':
      return 'Erro de rede. Verifique sua conexão e tente novamente';
    case 'service_unavailable':
      return 'Serviço temporariamente indisponível. Tente novamente em alguns momentos.';
    case 'timeout':
      return 'Operação expirou. Verifique sua conexão e tente novamente.';
    case 'firestore_error':
      return 'Erro no banco de dados. Tente novamente em alguns momentos.';
    default:
      return error.message || 'Ocorreu um erro inesperado';
  }
};

export const useListPlacesStore = create<ListPlacesState>()(
  persist(
    (set, get) => ({
      placesByListId: {},
      loadingByListId: {},
      errorByListId: {},

      fetchListPlaces: async (listId: string) => {
        try {
          console.log('📍 [Store] Starting fetchListPlaces for listId:', listId);
          
          set((state) => ({
            loadingByListId: { ...state.loadingByListId, [listId]: true },
            errorByListId: { ...state.errorByListId, [listId]: null }
          }));
          
          console.log('📍 [Store] Loading state set to true for listId:', listId);
          console.log('📍 [Store] Calling listsService.getListPlaces...');
          
          const places = await listsService.getListPlaces(listId);
          console.log("🚀 [Store] listsService.getListPlaces returned:", places);
          console.log("🚀 [Store] Number of places returned:", places?.length || 0);
          
          console.log('📍 [Store] Successfully fetched places for list:', listId, places.length);
          
          set((state) => ({
            placesByListId: { ...state.placesByListId, [listId]: places },
            loadingByListId: { ...state.loadingByListId, [listId]: false },
            errorByListId: { ...state.errorByListId, [listId]: null }
          }));
          
          console.log('📍 [Store] Store state updated. Current placesByListId:', get().placesByListId);
        } catch (error: any) {
          console.error('📍 Error fetching places for list:', listId, error);
          
          const errorMessage = error.code ? getErrorMessage(error) : 'Erro ao carregar lugares da lista';
          
          set((state) => ({
            loadingByListId: { ...state.loadingByListId, [listId]: false },
            errorByListId: { ...state.errorByListId, [listId]: errorMessage },
            placesByListId: { ...state.placesByListId, [listId]: [] } // Clear places on error
          }));
        }
      },

      addPlaceToList: async (addPlaceData: AddPlaceToListRequest, userId: string): Promise<ListPlace | null> => {
        try {
          const { listId } = addPlaceData;
          
          set((state) => ({
            loadingByListId: { ...state.loadingByListId, [listId]: true },
            errorByListId: { ...state.errorByListId, [listId]: null }
          }));
          
          console.log('📍 Adding place to list using cloud function:', addPlaceData);
          
          // Use the cloud function to add place to list
          const newListPlace = await listsService.addPlaceToList(addPlaceData, userId);
          
          console.log('📍 Successfully added place to list:', newListPlace.id);
          
          // Refresh the list places to get updated data
          await get().fetchListPlaces(listId);
          
          set((state) => ({
            loadingByListId: { ...state.loadingByListId, [listId]: false },
            errorByListId: { ...state.errorByListId, [listId]: null }
          }));
          
          return newListPlace;
        } catch (error: any) {
          console.error('📍 Error adding place to list:', error);
          
          const errorMessage = error.code ? getErrorMessage(error) : 'Erro ao adicionar lugar à lista';
          const { listId } = addPlaceData;
          
          set((state) => ({
            loadingByListId: { ...state.loadingByListId, [listId]: false },
            errorByListId: { ...state.errorByListId, [listId]: errorMessage }
          }));
          
          return null;
        }
      },

      removePlaceFromList: async (listId: string, placeId: string): Promise<boolean> => {
        try {
          set((state) => ({
            loadingByListId: { ...state.loadingByListId, [listId]: true },
            errorByListId: { ...state.errorByListId, [listId]: null }
          }));
          
          console.log('📍 Removing place from list:', listId, placeId);
          
          await listsService.removePlace(listId, placeId);
          
          const currentPlaces = get().placesByListId[listId] || [];
          const updatedPlaces = currentPlaces.filter(place => place.placeId !== placeId);
          
          set((state) => ({
            placesByListId: { ...state.placesByListId, [listId]: updatedPlaces },
            loadingByListId: { ...state.loadingByListId, [listId]: false },
            errorByListId: { ...state.errorByListId, [listId]: null }
          }));
          
          console.log('📍 Successfully removed place from list');
          return true;
        } catch (error: any) {
          console.error('📍 Error removing place from list:', error);
          
          const errorMessage = error.code ? getErrorMessage(error) : 'Erro ao remover lugar da lista';
          
          set((state) => ({
            loadingByListId: { ...state.loadingByListId, [listId]: false },
            errorByListId: { ...state.errorByListId, [listId]: errorMessage }
          }));
          
          return false;
        }
      },

      refreshListPlaces: async (listId: string) => {
        // Force refresh from server
        await get().fetchListPlaces(listId);
      },

      clearError: (listId: string) => {
        set((state) => ({
          errorByListId: { ...state.errorByListId, [listId]: null }
        }));
      },

      clearListPlaces: (listId: string) => {
        set((state) => ({
          placesByListId: { ...state.placesByListId, [listId]: [] },
          loadingByListId: { ...state.loadingByListId, [listId]: false },
          errorByListId: { ...state.errorByListId, [listId]: null }
        }));
      },

      // UI helper methods
      getListPlaces: (listId: string): ListPlaceWithDetails[] => {
        const state = get();
        return state.placesByListId[listId] || [];
      },

      getListPlacesCount: (listId: string): number => {
        const places = get().getListPlaces(listId);
        return places.length;
      },

      isLoading: (listId: string): boolean => {
        const state = get();
        return state.loadingByListId[listId] || false;
      },

      getError: (listId: string): string | null => {
        const state = get();
        return state.errorByListId[listId] || null;
      },
    }),
    {
      name: 'list-places-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        placesByListId: state.placesByListId,
        // Don't persist loading and error states
      }),
    }
  )
);
