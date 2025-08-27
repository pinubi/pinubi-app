import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { listsService } from '@/services/listsService';
import type { List, ListError, ListFormData } from '@/types/lists';

interface ListsState {
  lists: List[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchUserLists: (userId: string) => Promise<void>;
  createList: (listData: ListFormData, userId: string) => Promise<List | null>;
  updateList: (listId: string, listData: Partial<ListFormData>, userId: string) => Promise<List | null>;
  deleteList: (listId: string) => Promise<boolean>;
  clearError: () => void;
  refreshLists: (userId: string) => Promise<void>;
  
  // UI helpers
  getListById: (listId: string) => List | null;
  getListsByVisibility: (visibility: 'public' | 'private') => List[];
}

const mapListFormDataToCreateRequest = (formData: ListFormData) => ({
  title: formData.title,
  emoji: formData.emoji,
  description: formData.description,
  visibility: formData.visibility,
  tags: formData.tags,
});

const mapListFormDataToUpdateRequest = (listId: string, formData: Partial<ListFormData>) => ({
  listId,
  ...(formData.title !== undefined && { title: formData.title }),
  ...(formData.emoji !== undefined && { emoji: formData.emoji }),
  ...(formData.description !== undefined && { description: formData.description }),
  ...(formData.visibility !== undefined && { visibility: formData.visibility }),
  ...(formData.tags !== undefined && { tags: formData.tags }),
});

const getErrorMessage = (error: ListError): string => {
  switch (error.code) {
    case 'function_not_found':
      return 'Cloud Functions não implantadas. Entre em contato com o suporte.';
    case 'permission_denied':
      return 'Você não tem permissão para realizar esta ação';
    case 'list_not_found':
      return 'Lista não encontrada';
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
    case 'user_not_found':
      return 'Usuário não encontrado. Tente fazer login novamente.';
    case 'resource_exhausted':
      return 'Limite de listas atingido. Contas gratuitas têm limite de 5 listas. Considere atualizar sua conta.';
    case 'firestore_error':
      return 'Erro no banco de dados. Tente novamente em alguns momentos.';
    default:
      return error.message || 'Ocorreu um erro inesperado';
  }
};

export const useListsStore = create<ListsState>()(
  persist(
    (set, get) => ({
      lists: [],
      loading: false,
      error: null,

      fetchUserLists: async (userId: string) => {
        try {
          set({ loading: true, error: null });
          
          console.log('📋 Fetching user lists for userId:', userId);
          
          const lists = await listsService.getUserLists(userId);
          
          console.log('📋 Successfully fetched lists:', lists.length);
          
          set({ 
            lists,
            loading: false,
            error: null 
          });
        } catch (error: any) {
          console.error('📋 Error fetching user lists:', error);
          
          const errorMessage = error.code ? getErrorMessage(error) : 'Erro ao carregar listas';
          
          set({ 
            loading: false, 
            error: errorMessage,
            lists: [] // Clear lists on error to avoid showing stale data
          });
        }
      },

      createList: async (listData: ListFormData, userId: string): Promise<List | null> => {
        try {
          set({ loading: true, error: null });
          
          console.log('📋 Creating new list with data:', listData, 'for user:', userId);
          
          const createRequest = mapListFormDataToCreateRequest(listData);
          const newList = await listsService.createList(createRequest, userId);
          
          console.log('📋 Successfully created list:', newList.id);
          
          // Add the new list to the current lists
          const currentLists = get().lists;
          const updatedLists = [newList, ...currentLists];
          
          set({ 
            lists: updatedLists,
            loading: false,
            error: null 
          });
          
          return newList;
        } catch (error: any) {
          console.error('📋 Error creating list:', error);
          
          const errorMessage = error.code ? getErrorMessage(error) : 'Erro ao criar lista';
          
          set({ 
            loading: false, 
            error: errorMessage 
          });
          
          return null;
        }
      },

      updateList: async (listId: string, listData: Partial<ListFormData>, userId: string): Promise<List | null> => {
        try {
          set({ loading: true, error: null });
          
          console.log('📋 Updating list:', listId, 'with data:', listData, 'for user:', userId);
          
          const updateRequest = mapListFormDataToUpdateRequest(listId, listData);
          const updatedList = await listsService.updateList(updateRequest, userId);
          
          console.log('📋 Successfully updated list:', updatedList.id);
          
          // Update the list in the current lists array
          const currentLists = get().lists;
          const updatedLists = currentLists.map(list => 
            list.id === listId ? updatedList : list
          );
          
          set({ 
            lists: updatedLists,
            loading: false,
            error: null 
          });
          
          return updatedList;
        } catch (error: any) {
          console.error('📋 Error updating list:', error);
          
          const errorMessage = error.code ? getErrorMessage(error) : 'Erro ao atualizar lista';
          
          set({ 
            loading: false, 
            error: errorMessage 
          });
          
          return null;
        }
      },

      deleteList: async (listId: string): Promise<boolean> => {
        try {
          set({ loading: true, error: null });
          
          console.log('📋 Deleting list:', listId);
          
          await listsService.deleteList(listId);
          
          console.log('📋 Successfully deleted list:', listId);
          
          // Remove the list from the current lists array
          const currentLists = get().lists;
          const updatedLists = currentLists.filter(list => list.id !== listId);
          
          set({ 
            lists: updatedLists,
            loading: false,
            error: null 
          });
          
          return true;
        } catch (error: any) {
          console.error('📋 Error deleting list:', error);
          
          const errorMessage = error.code ? getErrorMessage(error) : 'Erro ao deletar lista';
          
          set({ 
            loading: false, 
            error: errorMessage 
          });
          
          return false;
        }
      },

      refreshLists: async (userId: string) => {
        // Force refresh from server
        await get().fetchUserLists(userId);
      },

      clearError: () => {
        set({ error: null });
      },

      // UI helper methods
      getListById: (listId: string): List | null => {
        const lists = get().lists;
        return lists.find(list => list.id === listId) || null;
      },

      getListsByVisibility: (visibility: 'public' | 'private'): List[] => {
        const lists = get().lists;
        return lists.filter(list => list.visibility === visibility);
      },
    }),
    {
      name: 'lists-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lists: state.lists,
        // Don't persist loading and error states
      }),
    }
  )
);
