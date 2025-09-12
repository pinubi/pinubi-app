import { useAuth } from '@/hooks/useAuth';
import { useListPlacesStore } from '@/store/listPlacesStore';
import type { AddPlaceToListRequest } from '@/types/lists';
import { useEffect } from 'react';

/**
 * Hook for managing places in a specific list
 * Automatically fetches places when listId changes
 */
export const useListPlaces = (listId: string) => {
  const { user, isAuthenticated } = useAuth();
  const {
    fetchListPlaces,
    addPlaceToList,
    removePlaceFromList,
    refreshListPlaces,
    clearError,
    clearListPlaces,
    getListPlaces,
    getListPlacesCount,
    isLoading,
    getError,
  } = useListPlacesStore();

  // Auto-fetch places when listId changes and user is authenticated
  useEffect(() => {
    if (listId && isAuthenticated) {      
      fetchListPlaces(listId);
    }

    // Cleanup function to clear places when component unmounts or listId changes
    return () => {
      if (listId) {
        clearListPlaces(listId);
      }
    };
  }, [listId, isAuthenticated, fetchListPlaces, clearListPlaces]);

  // Add place function that automatically passes userId
  const addPlaceWithUser = async (addPlaceData: Omit<AddPlaceToListRequest, 'listId'>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    const fullAddPlaceData: AddPlaceToListRequest = {
      ...addPlaceData,
      listId
    };
    
    return await addPlaceToList(fullAddPlaceData, user.id);
  };

  // Remove place function for the current list
  const removePlaceFromCurrentList = async (placeId: string) => {
    return await removePlaceFromList(listId, placeId);
  };

  // Refresh function for the current list
  const refresh = async () => {
    if (listId) {
      await refreshListPlaces(listId);
    }
  };

  // Clear error function for the current list
  const clearCurrentError = () => {
    if (listId) {
      clearError(listId);
    }
  };

  // Get data for the current list
  const places = getListPlaces(listId);
  const placesCount = getListPlacesCount(listId);
  const loading = isLoading(listId);
  const error = getError(listId);  

  return {
    // State
    places,
    placesCount,
    loading,
    error,
    
    // Actions
    addPlace: addPlaceWithUser,
    removePlace: removePlaceFromCurrentList,
    refresh,
    clearError: clearCurrentError,
    
    // Computed
    hasPlaces: places.length > 0,
    isEmpty: places.length === 0 && !loading,
  };
};
