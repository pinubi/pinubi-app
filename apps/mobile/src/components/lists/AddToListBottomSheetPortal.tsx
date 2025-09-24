import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import { Alert, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useListPlaces } from '@/hooks/useListPlaces';
import { useLists } from '@/hooks/useLists';
import type { List } from '@/types/lists';
import type { Place } from '@/types/places';

export type AddToListBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
  close: () => void;
};

interface AddToListBottomSheetPortalProps {
  place: Place | null;
  onClose?: () => void;
  onPlaceAdded?: (place: Place, list: List) => void;
}

const { width, height } = Dimensions.get('window');

const AddToListBottomSheetPortal = forwardRef<AddToListBottomSheetRef, AddToListBottomSheetPortalProps>(
  ({ place, onClose, onPlaceAdded }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const insets = useSafeAreaInsets();

    const { lists, loading: listsLoading, error: listsError } = useLists();
    const { addPlace } = useListPlaces(selectedListId || '');

    // Expose methods to parent component
    React.useImperativeHandle(ref, () => ({
      present: () => {
        showBottomSheet();
      },
      dismiss: () => {
        hideBottomSheet();
      },
      close: () => {
        hideBottomSheet();
      },
    }));

    const showBottomSheet = () => {
      if (!place) return;
      setIsVisible(true);
      setSelectedListId(null);
    };

    const hideBottomSheet = () => {
      setIsVisible(false);
      setSelectedListId(null);
      setIsAdding(false);
      onClose?.();
    };

    const handleListSelect = (listId: string) => {
      setSelectedListId(listId);
    };

    const handleAddToList = async () => {
      if (!place || !selectedListId) return;

      setIsAdding(true);

      try {
        const addPlaceData = {
          listId: selectedListId,
          placeId: place.id,
          personalNote: '',
          tags: [],
        };

        await addPlace(addPlaceData);

        const selectedList = lists.find((list) => list.id === selectedListId);
        if (selectedList) {
          onPlaceAdded?.(place, selectedList);
        }

        setIsVisible(false);
        Alert.alert('Lugar Adicionado! 🎉', `${place.googleData.name} foi adicionado à sua lista com sucesso.`, [
          { text: 'OK' },
        ]);
      } catch (error: any) {
        console.error('Error adding place to list:', error);
        Alert.alert('Erro', 'Não foi possível adicionar o lugar à lista. Tente novamente.', [{ text: 'OK' }]);
      } finally {
        setIsAdding(false);
      }
    };

    const handleCancel = () => {
      setIsVisible(false);
      setSelectedListId(null);
      onClose?.();
    };

    const renderListItem = (list: List) => {
      const isSelected = selectedListId === list.id;

      return (
        <TouchableOpacity
          key={list.id}
          onPress={() => handleListSelect(list.id)}
          className={`flex-row items-center p-4 mx-4 mb-3 rounded-xl border-2 ${
            isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'
          }`}
        >
          <View className='w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-4'>
            <Text className='text-2xl'>{list.emoji}</Text>
          </View>

          <View className='flex-1'>
            <Text className={`text-lg font-semibold ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
              {list.title}
            </Text>
            {list.description && (
              <Text className={`text-sm mt-1 ${isSelected ? 'text-primary-700' : 'text-gray-600'}`}>
                {list.description}
              </Text>
            )}
            <Text className={`text-xs mt-1 ${isSelected ? 'text-primary-600' : 'text-gray-500'}`}>
              {list.placesCount} {list.placesCount === 1 ? 'lugar' : 'lugares'}
            </Text>
          </View>

          <View className='ml-3'>
            {isSelected ? (
              <View className='w-6 h-6 rounded-full bg-primary-500 items-center justify-center'>
                <Ionicons name='checkmark' size={16} color='white' />
              </View>
            ) : (
              <View className='w-6 h-6 rounded-full border-2 border-gray-300' />
            )}
          </View>
        </TouchableOpacity>
      );
    };

    const renderNavigationButtons = () => {
      const canAdd = selectedListId !== null && !isAdding;

      return (
        <View className='flex-row items-center justify-between px-4 py-4 bg-white border-t border-gray-100'>
          {/* Cancel Button */}
          <TouchableOpacity onPress={handleCancel} className='flex-row items-center px-4 py-3'>
            <Ionicons name='close' size={20} color='#6B7280' />
            <Text className='text-gray-600 font-medium ml-2'>Cancelar</Text>
          </TouchableOpacity>

          {/* Add Button */}
          <TouchableOpacity
            onPress={handleAddToList}
            disabled={!canAdd}
            className={`flex-row items-center px-6 py-3 rounded-xl ${
              canAdd ? 'bg-primary-500' : 'bg-gray-300'
            }`}
          >
            {isAdding ? (
              <Text className='text-white font-semibold'>Adicionando...</Text>
            ) : (
              <>
                <Text className='text-white font-semibold mr-2'>Adicionar</Text>
                <Ionicons name='add' size={20} color='white' />
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    };

    const renderContent = () => {
      if (listsLoading) {
        return (
          <View className='flex-1 items-center justify-center p-8'>
            <Text className='text-gray-600 text-lg'>Carregando suas listas...</Text>
          </View>
        );
      }

      if (listsError) {
        return (
          <View className='flex-1 items-center justify-center p-8'>
            <Ionicons name='alert-circle-outline' size={48} color='#EF4444' />
            <Text className='text-gray-900 text-lg font-semibold mt-4 mb-2'>Erro ao carregar listas</Text>
            <Text className='text-gray-600 text-center'>{listsError}</Text>
          </View>
        );
      }

      if (lists.length === 0) {
        return (
          <View className='flex-1 items-center justify-center p-8'>
            <Ionicons name='list-outline' size={48} color='#9CA3AF' />
            <Text className='text-gray-900 text-lg font-semibold mt-4 mb-2'>Nenhuma lista encontrada</Text>
            <Text className='text-gray-600 text-center mb-6'>
              Crie sua primeira lista para começar a salvar lugares especiais
            </Text>
            <TouchableOpacity className='bg-primary-500 px-6 py-3 rounded-xl'>
              <Text className='text-white font-semibold'>Criar Nova Lista</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <ScrollView style={{ flex: 1 }} className='bg-gray-50' keyboardShouldPersistTaps='handled'>
          <View className='py-4'>
            <Text className='text-sm text-gray-600 px-4 mb-4'>Escolha uma lista para adicionar este lugar:</Text>
            {lists.map(renderListItem)}
          </View>
        </ScrollView>
      );
    };

    return (
      <Modal visible={isVisible} animationType='slide' presentationStyle='fullScreen' onRequestClose={hideBottomSheet}>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', height, width }}>
          {place && (
            <>
              {/* Header */}
              <View style={{ paddingTop: insets.top }} className='bg-white border-b border-gray-100'>
                <View className='px-4 py-4'>
                  <Text className='text-lg font-bold text-gray-900 mb-1'>Adicionar à Lista</Text>
                  <Text className='text-gray-600'>{place.googleData.name}</Text>
                </View>
              </View>

              {/* Content */}
              {renderContent()}

              {/* Navigation */}
              <View style={{ paddingBottom: insets.bottom }}>{renderNavigationButtons()}</View>
            </>
          )}
        </View>
      </Modal>
    );
  }
);

AddToListBottomSheetPortal.displayName = 'AddToListBottomSheetPortal';

export default AddToListBottomSheetPortal;